const assert = require('assert');
const EventEmitter = require('events');
const { Chitragupta } = require('../lib');

function request(id) {
  return {
    url: `/work?id=${id}`,
    method: 'GET',
    headers: {},
  };
}

function response() {
  const res = new EventEmitter();
  res.finished = false;
  res.statusCode = 200;
  return res;
}

function formatted(message) {
  return JSON.parse(Chitragupta.jsonLogFormatter({
    level: 'info',
    message,
    meta: { log: { kind: 'CONTEXT_TEST' } },
  }));
}

function setup(id, fn) {
  Chitragupta.setupServerLogger(
    { log() {} },
    request(id),
    response(),
    `user-${id}`,
    fn,
  );
}

function testNestedContextRestoration() {
  let inner;
  let outer;

  setup('a', () => {
    setup('b', () => {
      inner = formatted('inner');
    });
    outer = formatted('outer');
  });

  assert.strictEqual(inner.data.request.user_id, 'user-b');
  assert.strictEqual(outer.data.request.user_id, 'user-a');
}

async function testConcurrentPromiseIsolation() {
  const count = 200;
  const users = await Promise.all(Array.from({ length: count }, (_, id) => (
    new Promise((resolve, reject) => {
      setup(id, async () => {
        await Promise.resolve();
        await new Promise((done) => setTimeout(done, id % 5));
        try {
          resolve(formatted(`request-${id}`).data.request.user_id);
        } catch (error) {
          reject(error);
        }
      });
    })
  )));

  users.forEach((user, id) => {
    assert.strictEqual(user, `user-${id}`);
  });
}

function testFinishListenerKeepsRequestContext() {
  const records = [];
  const logger = {
    log(level, message, meta) {
      records.push(JSON.parse(Chitragupta.jsonLogFormatter({ level, message, meta })));
    },
  };
  const requestA = request('a');
  const responseA = response();
  const requestB = request('b');
  const responseB = response();

  Chitragupta.setupServerLogger(logger, requestA, responseA, 'user-a', () => {
    Chitragupta.setupServerLogger(logger, requestB, responseB, 'user-b', () => {
      responseA.finished = true;
      responseA.emit('finish');
    });
  });

  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].log.kind, 'NODE_REQUEST');
  assert.strictEqual(records[0].data.request.user_id, 'user-a');
  assert.strictEqual(records[0].data.request.endpoint, '/work');
  assert.strictEqual(records[0].data.request.params, 'id=a');
}

async function main() {
  testNestedContextRestoration();
  await testConcurrentPromiseIsolation();
  testFinishListenerKeepsRequestContext();
  process.stdout.write('context tests passed\n');
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
