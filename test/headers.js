const assert = require('assert');
const EventEmitter = require('events');
const { Chitragupta } = require('../lib');

function response() {
  const res = new EventEmitter();
  res.finished = true;
  res.statusCode = 200;
  res.duration = 1;
  return res;
}

function formatted(headers) {
  let record;
  Chitragupta.setupServerLogger(
    { log() {} },
    { url: '/api/resource?page=2', method: 'GET', headers },
    response(),
    'user-1',
    () => {
      record = JSON.parse(Chitragupta.jsonLogFormatter({
        level: 'info',
        message: 'Done',
        meta: { log: { kind: 'HEADER_TEST' } },
      }));
    },
  );
  return JSON.parse(record.data.request.headers);
}

function testSensitiveHeadersAreRedacted() {
  const logged = formatted({
    host: 'app.example.com',
    authorization: 'Bearer secret-token',
    cookie: 'session=secret-session',
    'x-api-key': 'secret-key',
  });

  assert.strictEqual(logged.authorization, '[REDACTED]');
  assert.strictEqual(logged.cookie, '[REDACTED]');
  assert.strictEqual(logged['x-api-key'], '[REDACTED]');
  assert.strictEqual(logged.host, 'app.example.com');
}

function testMatchIsCaseInsensitive() {
  assert.strictEqual(formatted({ Authorization: 'Bearer secret-token' }).Authorization, '[REDACTED]');
}

function testRequestHeadersAreNotMutated() {
  const headers = { authorization: 'Bearer secret-token' };
  formatted(headers);
  assert.strictEqual(headers.authorization, 'Bearer secret-token');
}

function testHostsCanExtendTheDenylist() {
  assert.strictEqual(formatted({ 'x-tenant-secret': 'secret' })['x-tenant-secret'], 'secret');
  Chitragupta.extendSensitiveHeaders(['X-Tenant-Secret']);
  assert.strictEqual(formatted({ 'x-tenant-secret': 'secret' })['x-tenant-secret'], '[REDACTED]');
}

testSensitiveHeadersAreRedacted();
testMatchIsCaseInsensitive();
testRequestHeadersAreNotMutated();
testHostsCanExtendTheDenylist();
process.stdout.write('header redaction tests passed\n');
