'use strict';

const WRAPPER_FIELDS = ['data', 'value', 'content', 'payload', 'result', 'message'];
const METADATA_FIELDS = ['txid', 'namespace', 'key', 'n', 'k'];

function findMetadata(source, fields) {
  const wanted = fields.map(function(field) { return field.toLowerCase(); });
  const queue = [source];
  const visited = [];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current == null || typeof current !== 'object' || visited.indexOf(current) !== -1)
      continue;

    visited.push(current);

    const keys = Object.keys(current);
    for (let i = 0; i < keys.length; i++) {
      const value = current[keys[i]];
      if (wanted.indexOf(keys[i].toLowerCase()) !== -1 && value != null && value !== '')
        return value;
      if (value != null && typeof value === 'object')
        queue.push(value);
    }
  }

  return null;
}

function setMetadataHeaders(res, metadata) {
  const headers = {
    'X-Signer-Address': metadata.signerAddress,
    'X-Signer-Name': metadata.signerName,
    'X-Signed-At': metadata.signedAt,
    'X-Transaction-Id': metadata.txid,
    'X-Block-Height': metadata.blockHeight,
    'X-Confirmations': metadata.confirmations
  };

  Object.keys(headers).forEach(function(header) {
    if (headers[header] != null && headers[header] !== '')
      res.setHeader(header, headers[header].toString());
  });
  res.setHeader('Access-Control-Expose-Headers', Object.keys(headers).join(', '));
}

function unwrapResponse(response) {
  if (response == null)
    return '';

  if (Buffer.isBuffer(response))
    return response.toString('utf8');

  if (typeof response !== 'object')
    return response.toString();

  for (let i = 0; i < WRAPPER_FIELDS.length; i++) {
    const field = WRAPPER_FIELDS[i];

    if (Object.prototype.hasOwnProperty.call(response, field) && response[field] != null)
      return response[field];
  }

  const payload = {};

  Object.keys(response).forEach(function(key) {
    if (METADATA_FIELDS.indexOf(key.toLowerCase()) === -1)
      payload[key] = response[key];
  });

  return payload;
}

function parseJsonPayload(payload) {
  if (Buffer.isBuffer(payload))
    payload = payload.toString('utf8');

  if (typeof payload !== 'string')
    return payload;

  const trimmed = payload.trim();

  if (trimmed === '')
    return null;

  return JSON.parse(trimmed);
}

function toPlainText(payload) {
  if (payload == null)
    return '';

  if (Buffer.isBuffer(payload))
    return payload.toString('utf8');

  if (typeof payload === 'string')
    return payload;

  if (typeof payload === 'number' || typeof payload === 'boolean')
    return payload.toString();

  return JSON.stringify(payload);
}

function sendByKey(res, key, response) {
  const normalizedKey = typeof key === 'string' ? key.toLowerCase() : '';
  const payload = unwrapResponse(response);

  if (normalizedKey.endsWith('.json')) {
    try {
      const jsonPayload = parseJsonPayload(payload);

      res.status(200);
      res.type('application/json');
      res.send(JSON.stringify(jsonPayload, null, 2));
    } catch (err) {
      res.status(502);
      res.type('application/json');
      res.send(JSON.stringify({
        error: 'Stored value is not valid JSON',
        message: err.message
      }));
    }

    return true;
  }

  if (normalizedKey.endsWith('.txt')) {
    res.status(200);
    res.type('text/plain');
    res.send(toPlainText(payload));
    return true;
  }

  return false;
}

module.exports = {
  findMetadata: findMetadata,
  parseJsonPayload: parseJsonPayload,
  sendByKey: sendByKey,
  setMetadataHeaders: setMetadataHeaders,
  toPlainText: toPlainText,
  unwrapResponse: unwrapResponse
};
