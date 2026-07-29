const bitcoinMessage = require('bitcoinjs-message');

const WIIICOIN_MESSAGE_PREFIX = '\x18Wiiicoin Signed Message:\n';
const BITCOIN_MESSAGE_PREFIX = '\x18Bitcoin Signed Message:\n';

/**
 * Verify compact signatures created for Wiiicoin addresses.
 *
 * Wiiicoin Core only accepts legacy P2PKH addresses in `verifymessage`.
 * W3Sign uses wrapped/native SegWit addresses, so those signatures must be
 * checked locally. The Bitcoin prefix is retained as a compatibility fallback
 * for signatures created by older W3Sign releases.
 */
function verifyMessage(address, signature, message) {
  if (
    typeof address !== 'string' ||
    typeof signature !== 'string' ||
    typeof message !== 'string'
  ) {
    return false;
  }

  return [WIIICOIN_MESSAGE_PREFIX, BITCOIN_MESSAGE_PREFIX].some((prefix) => {
    try {
      return bitcoinMessage.verify(message, address.trim(), signature.trim(), prefix, true);
    } catch (err) {
      return false;
    }
  });
}

module.exports = {
  verifyMessage,
  WIIICOIN_MESSAGE_PREFIX,
  BITCOIN_MESSAGE_PREFIX,
};
