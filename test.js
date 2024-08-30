const test = require('brittle')
const profanity = require('./index.js')

test('prefix and suffix', async function (t) {
  const wallet = await profanity('abc', 'def')

  t.is(typeof wallet.privateKey, 'string')
  t.is(typeof wallet.address, 'string')

  t.is(wallet.address.length, 42)
  t.ok(wallet.address.startsWith('0xabc'))
  t.ok(wallet.address.endsWith('def'))
})

test('prefix', async function (t) {
  const wallet = await profanity('abc', null)

  t.ok(wallet.address.startsWith('0xabc'))
})

test('suffix', async function (t) {
  const wallet = await profanity(null, 'def')

  t.ok(wallet.address.endsWith('def'))
})

test('timeout', async function (t) {
  try {
    await profanity('abc', 'def', { timeout: 1 })
    t.fail('should have failed')
  } catch (err) {
    t.is(err.code, 'PROFANITY_TIMEDOUT')
  }
})

test('retry', async function (t) {
  const wallet = await profanity('1337', '1337', { retry: 10, timeout: 5000 })

  t.ok(wallet.address.startsWith('0x1337'))
  t.ok(wallet.address.endsWith('1337'))
})
