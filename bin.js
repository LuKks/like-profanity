const minimist = require('minimist')
const crayon = require('tiny-crayon')
const profanity = require('./index.js')

const argv = minimist(process.argv.slice(2))

main().catch(err => {
  console.error('Error: ' + err.message)
  process.exit(1)
})

async function main () {
  if (!argv.prefix && !argv.suffix) {
    throw new Error('--prefix or --suffix are required')
  }

  const wallet = await profanity(argv.prefix, argv.suffix, {
    retry: argv.retry || 10,
    timeout: argv.timeout || 15000,
    verbose: argv.verbose || false
  })

  console.log('Address:', crayon.green(wallet.address))
  console.log('Private key:', crayon.green(wallet.privateKey))
}
