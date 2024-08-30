const path = require('path')
const cp = require('child_process')
const crayon = require('tiny-crayon')
const EC = require('elliptic').ec
const bigInt = require('big-integer')

const secp256k1 = new EC('secp256k1')

module.exports = async function profanity (prefix, suffix, opts = {}) {
  let {
    retry = 0
  } = opts

  // Profanity sometimes runs forever so we timeout early and retry
  while (true) {
    try {
      return await generateVanityAddress(prefix, suffix, opts)
    } catch (err) {
      if (!retry || err.code !== 'PROFANITY_TIMEDOUT') {
        throw err
      }

      retry--
    }
  }
}

function generateVanityAddress (prefix, suffix, opts = {}) {
  return new Promise((resolve, reject) => {
    if (typeof prefix !== 'string') prefix = (prefix || '').toString()
    if (typeof suffix !== 'string') suffix = (suffix || '').toString()

    const {
      bin = './profanity2.x64',
      timeout = 15000,
      verbose = false
    } = opts

    const cwd = path.dirname(bin)
    const keyPair = generateKeyPair()

    const pattern = prefix + 'X'.repeat(40 - prefix.length - suffix.length) + suffix

    const proc = cp.spawn(bin, [
      '--matching', pattern,
      '-z', keyPair.publicKey
    ], { cwd })

    const keyPair2 = {
      privateKey: null,
      address: null
    }

    const timeoutId = setTimeout(() => {
      proc.kill()

      reject(PROFANITY_ERROR('PROFANITY_TIMEDOUT', 'Profanity timed out'))
    }, timeout)

    proc.stdout.on('data', ondata)
    proc.on('close', onclose)

    function ondata (data) {
      const out = data.toString()
      const match = out.match(/Time: .*? ([\d]+)s Score: *? ([\d]+) Private: (.*?) Address: (.*)/i)

      if (verbose === true || verbose === 1) {
        if (match) {
          console.log(
            '- Profanity',
            'Time', crayon.yellow(match[1] + 's'),
            'Score', crayon.yellow(match[2]),
            'Address', crayon.green(match[4]),
            'Key', crayon.green(match[3])
          )
        }
      } else if (verbose === 2) {
        console.log(out)
      }

      if (!match) {
        return
      }

      const startsWith = !prefix || match[4].toLowerCase().startsWith('0x' + prefix)
      const endsWith = !suffix || match[4].toLowerCase().endsWith(suffix)

      if (startsWith && endsWith) {
        keyPair2.privateKey = match[3].slice(2)
        keyPair2.address = match[4]

        clearTimeout(timeoutId)
        proc.kill()
      }
    }

    function onclose (code) {
      clearTimeout(timeoutId)

      const failed = !keyPair2.privateKey || !keyPair2.address

      if (failed) {
        reject(PROFANITY_ERROR('PROFANITY_FAILED', 'Profanity failed'))
        return
      }

      const privateKey = addPrivateKeys(keyPair.privateKey, keyPair2.privateKey)
      const address = keyPair2.address

      resolve({ privateKey, address })
    }
  })
}

function generateKeyPair () {
  const key = secp256k1.genKeyPair()

  const publicKey = key.getPublic('hex').slice(2)
  const privateKey = key.getPrivate('hex')

  return { publicKey, privateKey }
}

function addPrivateKeys (pk1, pk2) {
  const a = bigInt(pk1, 16)
  const b = bigInt(pk2, 16)

  const sum = a.plus(b).mod(bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F', 16))

  return sum.toString(16)
}

function PROFANITY_ERROR (code, message) {
  const err = new Error(message)
  err.code = code
  return err
}
