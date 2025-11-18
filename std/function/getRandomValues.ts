if (defined(ENV_NODE) && !defined(ENV_CJS)) {
  // @ts-ignore
  import crypto from 'crypto'
}

let crypto_: Crypto

if (defined(ENV_NODE)) {
  if (defined(ENV_CJS)) {
    crypto_ = require('crypto')
  }
  else {
    crypto_ = crypto as globalThis.Crypto
  }
}
else {
  if (typeof crypto !== 'undefined') {
    crypto_ = crypto as globalThis.Crypto
  }
}

export default function getRandomValues(buffer: Uint8Array) {
  if (defined(ENV_NODE)) {
    // @ts-ignore
    crypto_.randomFillSync(buffer)
  }
  else {
    crypto_.getRandomValues(buffer)
  }
}
