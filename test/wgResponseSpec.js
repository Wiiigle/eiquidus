'use strict';

const wgResponse = require('../lib/wg-response');

describe('W3Sign WG responses', function() {
  it('finds nested transaction metadata', function() {
    expect(wgResponse.findMetadata({result: {tx_hash: 'abc123'}}, ['txid', 'tx_hash'])).toEqual('abc123');
  });

  it('sets verification metadata and exposes it to browsers', function() {
    const headers = {};
    const res = {
      setHeader: function(name, value) {
        headers[name] = value;
      }
    };

    wgResponse.setMetadataHeaders(res, {
      signerAddress: 'WSigner',
      signerName: 'Alice',
      signedAt: 1234,
      txid: 'abc123',
      blockHeight: 50,
      confirmations: 7
    });

    expect(headers['X-Signer-Address']).toEqual('WSigner');
    expect(headers['X-Signer-Name']).toEqual('Alice');
    expect(headers['X-Signed-At']).toEqual('1234');
    expect(headers['X-Transaction-Id']).toEqual('abc123');
    expect(headers['X-Block-Height']).toEqual('50');
    expect(headers['X-Confirmations']).toEqual('7');
    expect(headers['Access-Control-Expose-Headers']).toContain('X-Signer-Address');
  });
});
