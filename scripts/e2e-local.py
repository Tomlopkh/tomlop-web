"""End-to-end test against a LOCAL build: admin sign-in and CRUD, the feed, the full OAuth flow
for AI connectors (with its attack cases), and every MCP tool.

    npm run build
    cp .dev.vars .output/server/.dev.vars          # NUXT_ADMIN_*, NUXT_SESSION_*, NUXT_SESSION_COOKIE_SECURE=false
    npx wrangler d1 migrations apply tomlop --local --persist-to .wrangler/state
    npx wrangler d1 execute tomlop --local --persist-to .wrangler/state --file seed.sql
    npx wrangler dev --config .output/server/wrangler.json --persist-to .wrangler/state \\
        --port 8799 --var NUXT_PUBLIC_SITE_URL:http://localhost:8799 &
    TOMLOP_ADMIN_EMAIL=you@example.com TOMLOP_ADMIN_PASSWORD='...' python3 -I scripts/e2e-local.py

It signs in 3 times and the login limit is 5 per 15 minutes, so clear the counters between
runs:  wrangler d1 execute tomlop --local --persist-to .wrangler/state --command "DELETE FROM rate_limits"
It creates and removes two test articles; never point it at production.
"""
import base64, hashlib, http.cookiejar, json, secrets, sys, urllib.error, urllib.parse, urllib.request

import os
B = os.environ.get("TOMLOP_BASE", "http://localhost:8799")
EMAIL = os.environ["TOMLOP_ADMIN_EMAIL"]
PASSWORD = os.environ["TOMLOP_ADMIN_PASSWORD"]
fails = []

def check(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if (extra and not cond) else ""))
    if not cond: fails.append(name)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None

def make(jar=None, follow=True):
    h = [urllib.request.HTTPCookieProcessor(jar)] if jar is not None else []
    if not follow: h.append(NoRedirect())
    return urllib.request.build_opener(*h)

def call(op, method, path, body=None, headers=None, form=False):
    data = None; hd = dict(headers or {})
    if body is not None:
        if form: data = urllib.parse.urlencode(body).encode(); hd["content-type"] = "application/x-www-form-urlencoded"
        else: data = json.dumps(body).encode(); hd["content-type"] = "application/json"
    req = urllib.request.Request(B + path, data=data, method=method, headers=hd)
    try:
        r = op.open(req); raw = r.read(); status = r.status; rh = r.headers
    except urllib.error.HTTPError as e:
        raw = e.read(); status = e.code; rh = e.headers
    try: js = json.loads(raw)
    except Exception: js = None
    return status, js, raw.decode("utf-8", "replace"), rh

jar = http.cookiejar.CookieJar(); admin = make(jar)
anon = make()

# ---------- admin sign-in
s, js, _, _ = call(anon, "POST", "/api/admin/auth/login", {"email": EMAIL, "password": "wrong"})
check("wrong password -> 401", s == 401)
s, js, _, _ = call(anon, "POST", "/api/admin/auth/login", {"email": "other@example.com", "password": PASSWORD})
check("wrong email -> 401", s == 401)
s, js, _, _ = call(anon, "POST", "/api/admin/auth/login", {"email": EMAIL, "password": PASSWORD}, headers={"origin": "https://evil.example"})
check("cross-origin login post -> 403", s == 403)
s, js, _, _ = call(admin, "POST", "/api/admin/auth/login", {"email": EMAIL, "password": PASSWORD})
check("correct login -> 200", s == 200, str(s))
check("session cookie is HttpOnly", any(c.has_nonstandard_attr("HttpOnly") or c._rest.get("HttpOnly") is not None for c in jar))

# ---------- article CRUD
s, js, _, _ = call(admin, "GET", "/api/admin/articles")
check("list has 86 + suggested id", s == 200 and len(js["articles"]) == 86 and js["suggestedNextId"].startswith("87-"), str(js and js.get("suggestedNextId")))
md = "# Test Article / អត្ថបទសាកល្បង\n\nសួស្តី។\n\n## ផ្នែក\n\n- **ពាក្យគន្លឹះ៖** ការពន្យល់\n"
s, js, _, _ = call(admin, "POST", "/api/admin/articles", {"id": "Bad ID", "markdown": md, "published": True})
check("bad id -> 422", s == 422, str(s))
s, js, _, _ = call(admin, "POST", "/api/admin/articles", {"id": "87-test-article", "markdown": "no heading", "published": True})
check("no heading -> 422", s == 422)
s, js, _, _ = call(admin, "POST", "/api/admin/articles", {"id": "87-test-article", "markdown": md, "published": False})
check("create draft -> 200", s == 200 and js["warnings"] == [], str(js))
s, js, _, _ = call(admin, "POST", "/api/admin/articles", {"id": "87-test-article", "markdown": md, "published": False})
check("duplicate -> 422", s == 422)
s, feed, _, _ = call(anon, "GET", "/library/library.json")
check("draft NOT in feed", s == 200 and len(feed["articles"]) == 86)
s, _, _, _ = call(anon, "GET", "/library/articles/87-test-article.md")
check("draft markdown -> 404", s == 404)
s, _, _, _ = call(anon, "GET", "/read/87-test-article/")
check("draft page -> 404", s == 404)
s, js, _, _ = call(admin, "PUT", "/api/admin/articles/87-test-article", {"markdown": md, "published": True})
check("publish -> 200", s == 200)
s, feed, _, _ = call(anon, "GET", "/library/library.json")
check("published article IS in feed (cache purged)", s == 200 and len(feed["articles"]) == 87 and feed["articles"][-1]["id"] == "87-test-article", str(len(feed["articles"]) if feed else s))
s, _, raw, _ = call(anon, "GET", "/library/articles/87-test-article.md")
entry = [a for a in feed["articles"] if a["id"] == "87-test-article"][0]
check("md sha256 matches feed", hashlib.sha256(raw.encode()).hexdigest() == entry["sha256"] and len(raw.encode()) == entry["bytes"])
s, _, html, _ = call(anon, "GET", "/read/87-test-article/")
check("web page renders bold as <strong>", s == 200 and "<strong>" in html and "ពាក្យគន្លឹះ៖" in html)

# ---------- OAuth + MCP
s, meta, _, _ = call(anon, "GET", "/.well-known/oauth-authorization-server")
check("AS metadata", s == 200 and meta["code_challenge_methods_supported"] == ["S256"] and meta["issuer"] == B)
s, pr, _, _ = call(anon, "GET", "/.well-known/oauth-protected-resource/mcp")
check("protected-resource metadata", s == 200 and pr["resource"] == B + "/mcp")
s, js, _, rh = call(anon, "POST", "/mcp", {"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
check("mcp without token -> 401 + resource_metadata", s == 401 and "resource_metadata" in (rh.get("www-authenticate") or ""))
s, _, _, _ = call(anon, "POST", "/oauth/register", {"redirect_uris": ["http://evil.example/cb"]})
check("register: plain http non-loopback refused", s == 400)
s, client, _, _ = call(anon, "POST", "/oauth/register", {"client_name": "Test Claude", "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"]})
check("register ok", s == 201 and client["client_id"].startswith("mcp_"))
cid = client["client_id"]; redirect = "https://claude.ai/api/mcp/auth_callback"
verifier = secrets.token_urlsafe(48); challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
q = {"client_id": cid, "redirect_uri": redirect, "response_type": "code", "code_challenge": challenge, "code_challenge_method": "S256", "state": "xyz", "scope": "articles", "resource": B + "/mcp"}
nr = make(follow=False)
s, _, _, rh = call(nr, "GET", "/oauth/authorize?" + urllib.parse.urlencode(q))
check("authorize -> redirect to /admin/connect", s == 302 and (rh.get("location") or "").startswith("/admin/connect?"))
bad = dict(q); bad["redirect_uri"] = "https://evil.example/cb"
s, _, _, _ = call(nr, "GET", "/oauth/authorize?" + urllib.parse.urlencode(bad))
check("authorize with unregistered redirect_uri is an error, not a redirect", s == 400)
nopkce = dict(q); del nopkce["code_challenge"]; del nopkce["code_challenge_method"]
s, _, _, rh = call(nr, "GET", "/oauth/authorize?" + urllib.parse.urlencode(nopkce))
check("public client without PKCE rejected via error redirect", s == 302 and "error=invalid_request" in (rh.get("location") or ""))
s, _, _, _ = call(anon, "POST", "/api/admin/oauth/approve", {"params": q, "approve": True})
check("approve without admin session -> 401", s == 401)
s, info, _, _ = call(admin, "GET", "/api/admin/oauth/request?" + urllib.parse.urlencode(q))
check("consent info", s == 200 and info["client"]["name"] == "Test Claude" and info["redirectHost"] == "claude.ai")
s, js, _, _ = call(admin, "POST", "/api/admin/oauth/approve", {"params": q, "approve": False})
check("deny -> access_denied redirect", s == 200 and "error=access_denied" in js["redirect"] and "state=xyz" in js["redirect"])
s, js, _, _ = call(admin, "POST", "/api/admin/oauth/approve", {"params": q, "approve": True})
loc = urllib.parse.urlparse(js["redirect"]); qs = urllib.parse.parse_qs(loc.query); code = qs["code"][0]
check("approve -> code + state + iss", s == 200 and qs["state"] == ["xyz"] and qs["iss"] == [B])

def token(body): return call(anon, "POST", "/oauth/token", body, form=True)
s, js, _, _ = token({"grant_type": "authorization_code", "client_id": cid, "code": code, "redirect_uri": redirect, "code_verifier": "x" * 50})
check("wrong PKCE verifier rejected", s == 400 and js["error"] == "invalid_grant", str(js))
# that failed attempt burned the code (single use): get a new one
s, js, _, _ = call(admin, "POST", "/api/admin/oauth/approve", {"params": q, "approve": True})
code = urllib.parse.parse_qs(urllib.parse.urlparse(js["redirect"]).query)["code"][0]
s, tok, _, _ = token({"grant_type": "authorization_code", "client_id": cid, "code": code, "redirect_uri": redirect, "code_verifier": verifier})
check("token exchange ok", s == 200 and tok["token_type"] == "Bearer" and tok["refresh_token"], str(tok))
access, refresh = tok["access_token"], tok["refresh_token"]
s, js, _, _ = token({"grant_type": "authorization_code", "client_id": cid, "code": code, "redirect_uri": redirect, "code_verifier": verifier})
check("replayed code rejected", s == 400)
s, js, _, _ = call(anon, "POST", "/mcp", {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, headers={"authorization": "Bearer " + access})
check("replayed code revoked the access token from it", s == 401, str(s))

# fresh grant for MCP tests
s, js, _, _ = call(admin, "POST", "/api/admin/oauth/approve", {"params": q, "approve": True})
code = urllib.parse.parse_qs(urllib.parse.urlparse(js["redirect"]).query)["code"][0]
s, tok, _, _ = token({"grant_type": "authorization_code", "client_id": cid, "code": code, "redirect_uri": redirect, "code_verifier": verifier})
access, refresh = tok["access_token"], tok["refresh_token"]
H = {"authorization": "Bearer " + access}
def rpc(method, params=None, i=1): return call(anon, "POST", "/mcp", {"jsonrpc": "2.0", "id": i, "method": method, "params": params or {}}, headers=H)
s, js, _, _ = rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}})
check("mcp initialize", s == 200 and js["result"]["serverInfo"]["name"] == "tomlop")
s, js, _, _ = rpc("tools/list")
names = [t["name"] for t in js["result"]["tools"]]
check("mcp tools listed", set(names) == {"get_platform_guide", "list_articles", "get_article", "check_article", "create_article", "update_article", "publish_article", "delete_article"}, str(names))
check("delete is marked destructive", [t for t in js["result"]["tools"] if t["name"] == "delete_article"][0]["annotations"]["destructiveHint"] is True)
def tool(name, args):
    s, js, _, _ = rpc("tools/call", {"name": name, "arguments": args})
    res = js["result"]; txt = res["content"][0]["text"]
    if res.get("isError"): return s, res, txt
    try: return s, res, json.loads(txt)
    except Exception: return s, res, txt
s, r, out = tool("get_platform_guide", {})
check("guide mentions **bold** as supported", "only `**bold**` is supported" in out)
s, r, out = tool("list_articles", {})
check("list_articles has suggestedNextId 88", out["count"] == 87 and out["suggestedNextId"].startswith("88-"), str(out.get("suggestedNextId")))
s, r, out = tool("check_article", {"id": "88-mcp-made", "markdown": md})
check("check_article ok, no warnings", out["ok"] and out["warnings"] == [], str(out))
s, r, out = tool("check_article", {"id": "88-mcp-made", "markdown": md + "### nope\n"})
check("check_article warns on ###", out["ok"] and len(out["warnings"]) == 1)
s, r, out = tool("create_article", {"id": "88-mcp-made", "markdown": md.replace("Test Article", "Made By MCP")})
check("create_article makes a draft", out["published"] is False and out["saved"] == "88-mcp-made", str(out))
s, feed, _, _ = call(anon, "GET", "/library/library.json")
check("MCP draft not in feed", all(a["id"] != "88-mcp-made" for a in feed["articles"]))
s, r, out = tool("publish_article", {"id": "88-mcp-made", "published": True})
s, feed, _, _ = call(anon, "GET", "/library/library.json")
check("MCP publish -> in feed", any(a["id"] == "88-mcp-made" for a in feed["articles"]))
s, r, out = tool("update_article", {"id": "88-mcp-made", "markdown": md.replace("Test Article", "Edited By MCP")})
s, r, out = tool("get_article", {"id": "88-mcp-made"})
check("update kept it published + new text", out["published"] is True and "Edited By MCP" in out["markdown"])
s, r, out = tool("create_article", {"id": "../../etc/passwd", "markdown": md})
check("tool rejects bad id (isError)", r.get("isError") is True)
s, r, out = tool("nope", {})
check("unknown tool -> isError", r.get("isError") is True)
s, r, out = tool("delete_article", {"id": "88-mcp-made"})
s, _, _, _ = call(anon, "GET", "/library/articles/88-mcp-made.md")
check("MCP delete -> gone (cache purged)", s == 404)

# refresh rotation + reuse detection
s, tok2, _, _ = token({"grant_type": "refresh_token", "client_id": cid, "refresh_token": refresh})
check("refresh rotates", s == 200 and tok2["refresh_token"] != refresh)
s, js, _, _ = token({"grant_type": "refresh_token", "client_id": cid, "refresh_token": refresh})
check("old refresh token reuse rejected", s == 400)
s, js, _, _ = call(anon, "POST", "/mcp", {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, headers={"authorization": "Bearer " + tok2["access_token"]})
check("reuse revoked the whole family", s == 401, str(s))

# fresh token for disconnect test
s, js, _, _ = call(admin, "POST", "/api/admin/oauth/approve", {"params": q, "approve": True})
code = urllib.parse.parse_qs(urllib.parse.urlparse(js["redirect"]).query)["code"][0]
s, tok3, _, _ = token({"grant_type": "authorization_code", "client_id": cid, "code": code, "redirect_uri": redirect, "code_verifier": verifier})
s, conns, _, _ = call(admin, "GET", "/api/admin/oauth/connections")
check("connections list shows the client as connected", conns["mcpUrl"] == B + "/mcp" and any(c["id"] == cid and c["active"] for c in conns["connections"]), str(conns))
s, _, _, _ = call(admin, "DELETE", "/api/admin/oauth/connections/" + cid)
s, js, _, _ = call(anon, "POST", "/mcp", {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, headers={"authorization": "Bearer " + tok3["access_token"]})
check("disconnect kills the token immediately", s == 401)

# cleanup test article and logout
call(admin, "DELETE", "/api/admin/articles/87-test-article")
s, feed, _, _ = call(anon, "GET", "/library/library.json")
check("cleanup: feed back to 86", len(feed["articles"]) == 86)
s, _, _, _ = call(admin, "POST", "/api/admin/auth/logout", {})
s, _, _, _ = call(admin, "GET", "/api/admin/articles")
check("after logout admin api -> 401", s == 401)

print("\n%d failed" % len(fails)); sys.exit(1 if fails else 0)
