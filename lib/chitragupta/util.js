const cls = require('./cls');
const categories = require('./categories');
const formatVersions = require('./format_versions');

function populateServerData(dataParam) {
  const data = dataParam;
  const request = cls.get('request');
  const response = cls.get('response');

  // TODO: The following request meta data are not possible with the current frameworks being used
  // data.data.request.controller = "TODO";
  // data.data.request.function = "TODO";
  // data.data.request.ip = "TODO";

  // Need to check for response.finished as by default the response object
  // holds a 200 statusCode till the response is not sent
  if (response.finished) {
    data.data.response.status = response.statusCode;
    data.data.response.duration = response.duration;
  }

  data.meta.format.category = categories.SERVER;
  data.meta.format.version = formatVersions.SERVER;

  data.log.id = data.log.id || request.headers['x-chitragupta-log-id'];
}

function populateProcessData(dataParam) {
  const data = dataParam;
  data.data.name = cls.get('process_name');
  data.data.execution_id = cls.get('execution_id');

  data.meta.format.category = categories.PROCESS;
  data.meta.format.version = formatVersions.PROCESS;
}

function populateWorkerData(dataParam) {
  const data = dataParam;
  data.data.worker_name = cls.get('worker_name');
  data.data.thread_id = cls.get('thread_id');

  if (cls.get('job_id')) data.data.job_id = cls.get('job_id');
  data.meta.format.category = categories.WORKER;
  data.meta.format.version = formatVersions.WORKER;
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

  data.meta.format = data.meta.format || {};

  if (cls.get('server')) populateServerData(data);
  else if (cls.get('process')) populateProcessData(data);
  else if (cls.get('worker')) populateWorkerData(data);
  return data;
}

function sanitizeKeys(logLevel, message, metaData) {
  const data = initializeData(message, metaData);
  data.log.level = logLevel;
  data.meta.timestamp = new Date();
  return data;
}

module.exports.sanitizeKeys = sanitizeKeys;
