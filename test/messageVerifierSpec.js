const bitcoinMessage = require('bitcoinjs-message');
const bs58check = require('bs58check');
const createHash = require('create-hash');
const secp256k1 = require('secp256k1');
const verifier = require('../lib/message_verifier');

function hash160(value) {
  const sha256 = createHash('sha256').update(value).digest();
  return createHash('ripemd160').update(sha256).digest();
}

function wrappedSegwitAddress(privateKey) {
  const publicKey = secp256k1.publicKeyCreate(privateKey, true);
  const redeemScript = Buffer.concat([Buffer.from('0014', 'hex'), hash160(publicKey)]);
  return bs58check.encode(Buffer.concat([Buffer.from([0x03]), hash160(redeemScript)]));
}

describe('Wiiicoin message verifier', () => {
  const privateKey = Buffer.from('11'.repeat(32), 'hex');
  const address = wrappedSegwitAddress(privateKey);
  const message = 'W3Sign claim';

  it('accepts wrapped-SegWit signatures using the Wiiicoin prefix', () => {
    const signature = bitcoinMessage
      .sign(message, privateKey, true, verifier.WIIICOIN_MESSAGE_PREFIX, {
        segwitType: 'p2sh(p2wpkh)',
      })
      .toString('base64');

    expect(verifier.verifyMessage(address, signature, message)).toBe(true);
  });

  it('accepts the Qt namespace authorization signature regression vector', () => {
    expect(verifier.verifyMessage(
      '2Yp8EEExLydafWSbQZTfybKYYxo1HMNYVz',
      'IN7GblboGIA6S3yFgfLTVD2kgIIpFzlYeRH4c2FZxCTNWrimjAMmJPqrRvVibHQ5AucTmd0o9f1HH/MSL9kiWWw=',
      '1234'
    )).toBe(true);
  });

  it('accepts signatures from older W3Sign releases with the incorrect Wiiicoin prefix length', () => {
    const signature = bitcoinMessage
      .sign(message, privateKey, true, verifier.LEGACY_WIIICOIN_MESSAGE_PREFIX, {
        segwitType: 'p2sh(p2wpkh)',
      })
      .toString('base64');

    expect(verifier.verifyMessage(address, signature, message)).toBe(true);
  });

  it('accepts older W3Sign signatures using the Bitcoin prefix', () => {
    const signature = bitcoinMessage
      .sign(message, privateKey, true, { segwitType: 'p2sh(p2wpkh)' })
      .toString('base64');

    expect(verifier.verifyMessage(address, signature, message)).toBe(true);
  });

  it('rejects a signature for a different message', () => {
    const signature = bitcoinMessage
      .sign(message, privateKey, true, { segwitType: 'p2sh(p2wpkh)' })
      .toString('base64');

    expect(verifier.verifyMessage(address, signature, 'different')).toBe(false);
  });
});
