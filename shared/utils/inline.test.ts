import { describe, expect, it } from 'vitest'
import { splitBold } from './inline'

describe('splitBold', () => {
  it('bolds the text between markers, as the Android reader does', () => {
    expect(splitBold('**ឈប់សន្និដ្ឋានលឿនពេក៖** ទុកពេលសួរខ្លួនឯង')).toEqual([
      { text: 'ឈប់សន្និដ្ឋានលឿនពេក៖', bold: true },
      { text: ' ទុកពេលសួរខ្លួនឯង', bold: false },
    ])
  })

  it('leaves plain text alone', () => {
    expect(splitBold('plain')).toEqual([{ text: 'plain', bold: false }])
  })

  it('handles several bold runs in one line', () => {
    expect(splitBold('a **b** c **d**').map((s) => s.bold)).toEqual([false, true, false, true])
  })

  it('bolds to the end when a marker is unbalanced, like the app', () => {
    expect(splitBold('a **b')).toEqual([{ text: 'a ', bold: false }, { text: 'b', bold: true }])
  })

  it('never produces markup: angle brackets stay text', () => {
    expect(splitBold('**<b>x</b>**')).toEqual([{ text: '<b>x</b>', bold: true }])
  })
})
