'use strict';

const CLS = require('./cls');
const CATEGORIES = require('./categories');
const FORMAT_VERSIONS = require('./format_versions');

function populateServerData(data) {
  const request = CLS.get('request');
  const response = CLS.get('response');
  data['data']['request'] = {};
  data['data']['response'] = {};

  let url = request.url;
  let [endpoint, params] = url.split('?');
  data['data']['request']['method'] = request.method;
  data['data']['request']['endpoint'] = endpoint;

  // TODO: The following request meta data are not possible with the current frameworks being used
  // data['data']['request']['controller'] = "TODO";
  // data['data']['request']['function'] = "TODO";
  // data['data']['request']['ip'] = "TODO";
  data['data']['request']['id'] = request.request_id;
  data['data']['request']['user_id'] = CLS.get('user_id');
  data['data']['request']['params'] = params;

  // Need to check for response.finished as by default the response object holds a 200 statusCode till the response is not sent
  if(response.finished) {
    data['data']['response']['status'] = response.statusCode;
    data['data']['response']['duration'] = response.duration;
  }

  data['meta']['format']['category'] = CATEGORIES.SERVER;
  data['meta']['format']['version'] = FORMAT_VERSIONS.SERVER;
}

function populateProcessData(data) {
  data['data']['name'] = CLS.get('process_name');
  data['data']['execution_id'] = CLS.get('execution_id');

  data['meta']['format']['category'] = CATEGORIES.PROCESS;
  data['meta']['format']['version'] = FORMAT_VERSIONS.PROCESS;
}

function initializeData(message, meta_data) {
  let data = {};
  data['data'] = {};

  data['log'] = meta_data['log'] || {};
  delete meta_data.log;

  data['meta'] = meta_data['meta'] || {};
  delete meta_data.meta;

  meta_data = JSON.stringify(meta_data);

  data['log'] = {};
  data['meta'] = {};
  data['log']['dynamic_data'] = (meta_data == '{}') ? message : `${message} ${meta_data}`;

  data['meta']['format'] = data['meta']['format'] || {};
  
  if(CLS.get('server'))
    populateServerData(data);
  else if(CLS.get('process'))
    populateProcessData(data);
  return data;
}

function sanitizeKeys(log_level, message, meta_data) {
  let data = initializeData(message, meta_data);
  data['log']['level'] = log_level;
  data['meta']['timestamp'] = new Date();
  return data;
}

module.exports.sanitizeKeys = sanitizeKeys;
