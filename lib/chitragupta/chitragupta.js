const { v4: uuidv4 } = require('uuid');

const CLS = require('./cls');
const UTIL = require('./util');
const CONSTANTS = require('./constants');

function getUniqueLogId() {
  return uuidv4();
}

function setupInitialServerData(request, response, userId) {
  request.request_id = getUniqueLogId();
  CLS.set('server', true);
  CLS.set('request_start_time', new Date());
  CLS.set('request', request);
  CLS.set('response', response);
  CLS.set('userId', userId);
}

function setupResponseOnFinishListener(logger, response) {
  response.on('finish', () => {
    response.duration = new Date() - CLS.get('request_start_time');
    logger.log('info', 'Done', { log: { kind: CONSTANTS.NODE_REQUEST_KIND } });
  });
}

function setupServerLogger(logger, request, response, userId, fn) {
  CLS.NS.run(() => {
    setupInitialServerData(request, response, userId);
    setupResponseOnFinishListener(logger, response);
    fn(request, response);
  });
}

function setupInitialProcessData(name) {
  CLS.set('process', true);
  CLS.set('process_name', name);
  CLS.set('execution_id', getUniqueLogId());
}

function setupProcessLogger(name, fn, ...args) {
  CLS.NS.run(() => {
    setupInitialProcessData(name);
    fn(...args);
  });
}

function jsonLogFormatter(options) {
  return JSON.stringify(UTIL.sanitizeKeys(options.level, options.message, options.meta));
}

module.exports = {
  setupServerLogger,
  setupProcessLogger,
  getUniqueLogId,
  jsonLogFormatter,
};
