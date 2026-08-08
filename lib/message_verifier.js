const bitcoinMessage = require('bitcoinjs-message');

const WIIICOIN_MESSAGE_PREFIX = '\x19Wiiicoin Signed Message:\n';
const LEGACY_WIIICOIN_MESSAGE_PREFIX = '\x18Wiiicoin Signed Message:\n';
const BITCOIN_MESSAGE_PREFIX = '\x18Bitcoin Signed Message:\n';

/**
 * Verify compact signatures created for Wiiicoin addresses.
 *
 * Wiiicoin Core only accepts legacy P2PKH addresses in `verifymessage`.
 * W3Sign uses wrapped/native SegWit addresses, so those signatures must be
 * checked locally. Older W3Sign releases encoded the 25-byte Wiiicoin message
 * prefix with a 24-byte length marker; retain that prefix and Bitcoin's as
 * compatibility fallbacks.
 */
function verifyMessage(address, signature, message) {
  if (
    typeof address !== 'string' ||
    typeof signature !== 'string' ||
    typeof message !== 'string'
  ) {
    return false;
  }

  return [WIIICOIN_MESSAGE_PREFIX, LEGACY_WIIICOIN_MESSAGE_PREFIX, BITCOIN_MESSAGE_PREFIX].some((prefix) => {
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
  LEGACY_WIIICOIN_MESSAGE_PREFIX,
  BITCOIN_MESSAGE_PREFIX,
};
