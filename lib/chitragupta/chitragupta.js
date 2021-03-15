'use strict';

const CLS = require('./cls');
const { v4: uuidv4 } = require('uuid');
const UTIL = require('./util');
const CONSTANTS = require('./constants');

function getUniqueLogId() {
  return uuidv4();
}

function setupServerLogger(logger, request, response, user_id, fn) {
  CLS.NS.run(() => {
    setupInitialServerData(request, response, user_id);
    setupResponseOnFinishListener(logger, response);
    fn(request, response);
  });
}

function setupInitialServerData(request, response, user_id) {
  request.request_id = getUniqueLogId();
  CLS.set('server', true);
  CLS.set('request_start_time', new Date());
  CLS.set('request', request);
  CLS.set('response', response);  
  CLS.set('user_id', user_id);  
}

function setupResponseOnFinishListener(logger, response) {
  response.on('finish', () => {
    response.duration = new Date() - CLS.get('request_start_time');
    logger.log('INFO', 'Done', {log: {kind: CONSTANTS.NODE_REQUEST_KIND}});
  });
}

function setupProcessLogger(name, fn, ...args) {
  CLS.NS.run(() => {
    setupInitialProcessData(name);
    fn(...args);
  });
}

function setupInitialProcessData(name) {
  CLS.set('process', true);
  CLS.set('process_name', name);
  CLS.set('execution_id', getUniqueLogId());
}

function jsonLogFormatter(options) {
  return JSON.stringify(UTIL.sanitizeKeys(options.level, options.message, options.meta));
}

module.exports = {
  setupServerLogger: setupServerLogger,
  setupProcessLogger: setupProcessLogger,
  getUniqueLogId: getUniqueLogId,
  jsonLogFormatter: jsonLogFormatter
};
