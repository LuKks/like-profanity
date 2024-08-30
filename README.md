# like-profanity

Generate a vanity ETH address with a given prefix and suffix

Depends on https://github.com/1inch/profanity2

```
npm i like-profanity
```

## Usage

```js
const profanity = require('like-profanity')

const wallet = await profanity('13', '37')

console.log(wallet) // => { privateKey, address }

const wallet2 = await profanity('13', null) // 0x13...
const wallet3 = await profanity(null, '37') // 0x...37
```

Profanity sometimes never finds a match, you can timeout it early and retry:

```js
const wallet = await profanity('1337', '1337', { retry: 10, timeout: 5000 })
```

You should adjust the timeout value depending on your GPU.

## API

#### `const wallet = await profanity(prefix, suffix, [options])`

Generate a vanity ETH account. Returns like `{ privateKey, address }`.

Available options:

```js
{
  bin: './profanity2.x64',
  timeout: 15000, // Adjust it depending on the GPU
  retry: 0, // Retry attempts on timeout
  verbose: false
}
```

## CLI

`npm i -g like-profanity`

```sh
profanity --prefix 1337 --suffix 1337 # --retry [n] --timeout [n] --verbose [1|2]
```

## License

MIT
