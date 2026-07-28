'use strict';

const WRAPPER_FIELDS = ['data', 'value', 'content', 'payload', 'result', 'message'];
const METADATA_FIELDS = ['txid', 'namespace', 'key', 'n', 'k'];

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
  parseJsonPayload: parseJsonPayload,
  sendByKey: sendByKey,
  toPlainText: toPlainText,
  unwrapResponse: unwrapResponse
};
