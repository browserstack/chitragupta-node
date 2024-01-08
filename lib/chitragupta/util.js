const cls = require('./cls');
const categories = require('./categories');
const formatVersions = require('./format_versions');
const fieldLimits = require('./field_limits');
const os = require('os');

function populateServerData(dataParam) {
  const data = dataParam;
  const request = cls.get('request');
  const response = cls.get('response');
  data.data.request = data.data.request || {};
  data.data.response = data.data.response || {};

  data.log.uuid = cls.get("uuid") || "";

  const { url } = request;
  const indexOfQuestionMark = url.indexOf('?');
  let endpoint;
  let params;
  if (indexOfQuestionMark > 0) {
    endpoint = url.slice(0, indexOfQuestionMark);
    params = url.slice(indexOfQuestionMark + 1);
  } else {
    endpoint = url;
  }

  data.data.request.method = data.data.request.method || request.method;
  data.data.request.endpoint = data.data.request.endpoint || endpoint;

  // TODO: The following request meta data are not possible with the current frameworks being used
  // data.data.request.controller = "TODO";
  // data.data.request.function = "TODO";
  // data.data.request.ip = "TODO";
  data.data.request.id = data.data.request.id || request.request_id;
  data.data.request.user_id = data.data.request.user_id || cls.get('userId');
  data.data.request.params = data.data.request.params || params;
  data.data.request.params = data.data.request.params.substring(0, fieldLimits.PARAMS) || true;

  // Need to check for response.finished as by default the response object
  // holds a 200 statusCode till the response is not sent
  if (response.finished) {
    data.data.response.status = response.statusCode;
    data.data.response.duration = response.duration;
  }

  data.meta.format.category = categories.SERVER;
  data.meta.format.version = formatVersions.SERVER;
  data.meta.host = os.hostname();

  data.log.id = data.log.id || request.headers['x-chitragupta-log-id'];
}

function populateProcessData(dataParam) {
  const data = dataParam;
  data.data.name = data.data.name || cls.get('process_name');
  data.data.execution_id = data.data.execution_id || cls.get('execution_id');

  data.meta.format.category = categories.PROCESS;
  data.meta.format.version = formatVersions.PROCESS;
  data.meta.host = os.hostname();
}

function populateWorkerData(dataParam) {
  const data = dataParam;
  data.data.worker_name = data.data.worker_name || cls.get('worker_name');
  data.data.thread_id = data.data.thread_id || cls.get('thread_id');

  if (!data.data.job_id && cls.get('job_id')) data.data.job_id = cls.get('job_id');
  data.meta.format.category = categories.WORKER;
  data.meta.format.version = formatVersions.WORKER;
  data.meta.host = os.hostname();
}

function populateDefaultFormatData(dataParam) {
  const data = dataParam;
  if (!data.meta.format.category) {
    data.meta.format.category = categories.SERVER;
  }
  if (!data.meta.format.version) {
    data.meta.format.version = formatVersions.SERVER;
  }
}

function initializeData(message, metaDataParam) {
  const data = {};
  const metaData = metaDataParam;

  data.data = metaData.data || {};
  delete metaData.data;

  data.log = metaData.log || {};
  delete metaData.log;

  data.meta = metaData.meta || {};
  delete metaData.meta;

  const metaDataStr = JSON.stringify(metaData);
  data.log.dynamic_data = (metaDataStr === '{}') ? message : `${message} ${metaDataStr}`;

  if (typeof data.log.dynamic_data === 'object') {
    data.log.dynamic_data = JSON.stringify(data.log.dynamic_data);
  }

  if (!data.log.kind) {
    data.log.kind = data.log.dynamic_data.substring(0, 40);
  }

  data.log.dynamic_data = data.log.dynamic_data.substring(0, fieldLimits.DYNAMIC_DATA) || true;

  data.meta.format = data.meta.format || {};

  if (cls.get('server')) populateServerData(data);
  else if (cls.get('process')) populateProcessData(data);
  else if (cls.get('worker')) populateWorkerData(data);
  else populateDefaultFormatData(data);
  return data;
}

function sanitizeKeys(logLevel, message, metaData) {
  const data = initializeData(message, metaData);
  data.log.level = logLevel;
  data.meta.timestamp = new Date();
  return data;
}

module.exports.sanitizeKeys = sanitizeKeys;
