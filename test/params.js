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

function formatted(request, meta = {}) {
  let record;
  Chitragupta.setupServerLogger(
    { log() {} },
    { method: 'GET', headers: {}, ...request },
    response(),
    'user-1',
    () => {
      record = JSON.parse(Chitragupta.jsonLogFormatter({
        level: 'info',
        message: 'Done',
        meta: { log: { kind: 'PARAMS_TEST' }, ...meta },
      }));
    },
  );
  return record.data.request;
}

function testSensitiveParamsAreRedacted() {
  const logged = formatted({ url: '/api/items?page=2&access_token=fixture-a&API_KEY=fixture-b&tool=jira' });

  assert.strictEqual(logged.params, 'page=2&access_token=[REDACTED]&API_KEY=[REDACTED]&tool=jira');
  assert.strictEqual(logged.endpoint, '/api/items');
}

function testEncodedParamNamesAreMatched() {
  const logged = formatted({ url: '/api/items?X-Amz-Signature=fixture-c&client%5Fsecret=fixture-d' });
  assert.strictEqual(logged.params, 'X-Amz-Signature=[REDACTED]&client%5Fsecret=[REDACTED]');
}

function testParamsWithoutValuesAreKept() {
  assert.strictEqual(formatted({ url: '/api/items?flag&token=fixture-e' }).params, 'flag&token=[REDACTED]');
}

function testHostSuppliedParamsObjectIsRedacted() {
  const logged = formatted({ url: '/api/items' }, { data: { request: { params: { token: 'fixture-f', page: 2 } } } });
  assert.deepStrictEqual(JSON.parse(logged.params), { token: '[REDACTED]', page: 2 });
}

function testHostsCanExtendTheDenylist() {
  assert.strictEqual(formatted({ url: '/oauth/callback?code=fixture-g&state=s' }).params, 'code=fixture-g&state=s');
  Chitragupta.extendSensitiveParams(['Code']);
  assert.strictEqual(formatted({ url: '/oauth/callback?code=fixture-g&state=s' }).params, 'code=[REDACTED]&state=s');
}

function testOriginalUrlIsPreferred() {
  // Express sets `url` relative to the router mount point and keeps the full path in `originalUrl`.
  const logged = formatted({ url: '/items?page=2', originalUrl: '/api/v1/items?page=2&token=fixture-h' });
  assert.strictEqual(logged.endpoint, '/api/v1/items');
  assert.strictEqual(logged.params, 'page=2&token=[REDACTED]');
}

function testUrlIsUsedWithoutOriginalUrl() {
  assert.strictEqual(formatted({ url: '/plain/path' }).endpoint, '/plain/path');
}

testSensitiveParamsAreRedacted();
testEncodedParamNamesAreMatched();
testParamsWithoutValuesAreKept();
testHostSuppliedParamsObjectIsRedacted();
testHostsCanExtendTheDenylist();
testOriginalUrlIsPreferred();
testUrlIsUsedWithoutOriginalUrl();
process.stdout.write('query param redaction tests passed\n');
