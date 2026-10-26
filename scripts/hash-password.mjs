#!/usr/bin/env node
/**
 * Creates a scrypt hash for NUXT_ADMIN_PASSWORD_HASH (same format nuxt-auth-utils verifies).
 * Usage: npm run hash-password            (prompts, input hidden)
 *        echo -n 'secret' | bun run --silent hash-password
 */
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { createInterface } from 'node:readline'

async function readPassword() {
  if (!process.stdin.isTTY) {
    let data = ''
    for await (const chunk of process.stdin) data += chunk
    return data.replace(/\r?\n$/, '')
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  rl._writeToOutput = (s) => {
    if (s.includes('Password')) process.stdout.write(s)
  }
  const answer = await new Promise(resolve => rl.question('Password: ', resolve))
  rl.close()
  process.stdout.write('\n')
  return answer
}

const password = await readPassword()
if (password.length < 12) {
  console.error('Use at least 12 characters (a passphrase is best).')
  process.exit(1)
}
const hash = await new Hash(new Scrypt({})).make(password)
console.log(`\nNUXT_ADMIN_PASSWORD_HASH='${hash}'\n`)
console.log('Store it as a secret: npx wrangler secret put NUXT_ADMIN_PASSWORD_HASH')
