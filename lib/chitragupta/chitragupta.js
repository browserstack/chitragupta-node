const { v4: uuidv4 } = require('uuid');

const cls = require('./cls');
const util = require('./util');
const constants = require('./constants');

function getUniqueLogId() {
  return uuidv4();
}

function setupInitialServerData(request, response, userId) {
  if (!request.request_id) {
    request.request_id = getUniqueLogId();
  }
  cls.set('server', true);
  if (!cls.get('request_start_time')) {
    cls.set('request_start_time', new Date());
  }
  cls.set('request', request);
  cls.set('response', response);
  cls.set('userId', userId);
}

function setupResponseOnFinishListener(logger, response) {
  response.on('finish', () => {
    response.duration = new Date() - cls.get('request_start_time');
    logger.log('info', 'Done', { log: { kind: constants.NODE_REQUEST_KIND } });
  });
}

function setupServerLogger(logger, request, response, userId, fn) {
  cls.ns.run(() => {
    setupInitialServerData(request, response, userId);
    setupResponseOnFinishListener(logger, response);
    fn(request, response);
  });
}

function setupInitialProcessData(name) {
  cls.set('process', true);
  cls.set('process_name', name);
  cls.set('execution_id', getUniqueLogId());
}

function setupProcessLogger(name, fn, ...args) {
  cls.ns.run(() => {
    setupInitialProcessData(name);
    fn(...args);
  });
}

function setupProcessLoggerV2(name, options = { returnOriginal: true}, fn, ...args) {
  const inner = () => {
    setupInitialProcessData(name);
    return fn(...args);
  }
  if(options.returnOriginal){
    // Same as run() but returns the return value of the callback rather than the context.
    return cls.ns.runAndReturn(inner);
  }
  else{
    // run returns the context associated with that callback
    return cls.ns.run(inner);
  }
}

function setupInitialWorkerData(name) {
  cls.set('worker', true);
  cls.set('worker_name', name);
  cls.set('thread_id', process.pid);
}

function setupWorkerLogger(name, fn, ...args) {
  cls.ns.run(() => {
    setupInitialWorkerData(name);
    fn(...args);
  });
}

function setWorkerJobId(jid, fn, ...args) {
  if (cls.get('worker')) {
    cls.ns.run(() => {
      cls.set('job_id', jid);
      fn(...args);
    });
  } else {
    throw new Error('Worker Job ID can be set only in the worker scope.');
  }
}

function jsonLogFormatter(options) {
  return JSON.stringify(util.sanitizeKeys(options.level, options.message, options.meta));
}

function setMetaData(key, value) {
  cls.set(key, value);
}

module.exports = {
  setupServerLogger,
  setupProcessLogger,
  setupProcessLoggerV2,
  setupWorkerLogger,
  setWorkerJobId,
  getUniqueLogId,
  jsonLogFormatter,
  setMetaData,
};
