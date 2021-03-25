const cls = require('./cls');
const categories = require('./categories');
const formatVersions = require('./format_versions');

function populateServerData(dataParam) {
  const data = dataParam;
  const request = cls.get('request');
  const response = cls.get('response');
  data.data.request = {};
  data.data.response = {};

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

  data.data.request.method = request.method;
  data.data.request.endpoint = endpoint;

  // TODO: The following request meta data are not possible with the current frameworks being used
  // data.data.request.controller = "TODO";
  // data.data.request.function = "TODO";
  // data.data.request.ip = "TODO";
  data.data.request.id = request.request_id;
  data.data.request.user_id = cls.get('userId');
  data.data.request.params = params;

  // Need to check for response.finished as by default the response object
  // holds a 200 statusCode till the response is not sent
  if (response.finished) {
    data.data.response.status = response.statusCode;
    data.data.response.duration = response.duration;
  }

  data.meta.format.category = categories.SERVER;
  data.meta.format.version = formatVersions.SERVER;
}

function populateProcessData(dataParam) {
  const data = dataParam;
  data.data.name = cls.get('process_name');
  data.data.execution_id = cls.get('execution_id');

  data.meta.format.category = categories.PROCESS;
  data.meta.format.version = formatVersions.PROCESS;
}

function initializeData(message, metaDataParam) {
  const data = {};
  const metaData = metaDataParam;
  data.data = {};

  data.log = metaData.log || {};
  delete metaData.log;

  data.meta = metaData.meta || {};
  delete metaData.meta;

  const metaDataStr = JSON.stringify(metaData);
  data.log.dynamic_data = (metaDataStr === '{}') ? message : `${message} ${metaDataStr}`;

  data.meta.format = data.meta.format || {};

  if (cls.get('server')) populateServerData(data);
  else if (cls.get('process')) populateProcessData(data);
  return data;
}

function sanitizeKeys(logLevel, message, metaData) {
  const data = initializeData(message, metaData);
  data.log.level = logLevel;
  data.meta.timestamp = new Date();
  return data;
}

module.exports.sanitizeKeys = sanitizeKeys;
