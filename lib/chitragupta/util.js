const cls = require('./cls');
const categories = require('./categories');
const formatVersions = require('./format_versions');
const fieldLimits = require('./field_limits');
const os = require('os');

// Sensitive headers that must never reach the log sink as cleartext values.
// Closes DATA-12974 (Authorization/Cookie/etc serialised verbatim) and weakens
// DATA-13003/13004 chains by removing the secret material at the source.
// Names are matched case-insensitively against the request header keys.
const DEFAULT_SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'proxy-authorization',
  'www-authenticate',
]);

const customSensitiveHeaders = new Set();

function extendSensitiveHeaders(headerNames) {
  if (!Array.isArray(headerNames)) return;
  headerNames.forEach((h) => {
    if (typeof h === 'string' && h.length) {
      customSensitiveHeaders.add(h.toLowerCase());
    }
  });
}

function isSensitiveHeader(name) {
  const lower = String(name).toLowerCase();
  return DEFAULT_SENSITIVE_HEADERS.has(lower) || customSensitiveHeaders.has(lower);
}

// Query parameters that carry credentials (OAuth tokens, API keys, signed-URL signatures).
// Matched case-insensitively against the decoded parameter name; the name is kept and the
// value is logged as [REDACTED].
const DEFAULT_SENSITIVE_PARAMS = new Set([
  'access_token',
  'refresh_token',
  'id_token',
  'token',
  'api_key',
  'apikey',
  'api_token',
  'private_token',
  'client_secret',
  'secret',
  'password',
  'signature',
  'x-amz-signature',
  'x-amz-credential',
  'x-amz-security-token',
]);

const customSensitiveParams = new Set();

function extendSensitiveParams(paramNames) {
  if (!Array.isArray(paramNames)) return;
  paramNames.forEach((p) => {
    if (typeof p === 'string' && p.length) {
      customSensitiveParams.add(p.toLowerCase());
    }
  });
}

function isSensitiveParam(name) {
  let decoded = String(name);
  try {
    decoded = decodeURIComponent(decoded.replace(/\+/g, ' '));
  } catch (error) {
    // Malformed escapes: match on the raw name.
  }
  const lower = decoded.toLowerCase();
  return DEFAULT_SENSITIVE_PARAMS.has(lower) || customSensitiveParams.has(lower);
}

// Accepts the raw query string (`a=1&token=x`) or a params object set by the host.
function redactParams(params) {
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    const out = {};
    Object.keys(params).forEach((key) => {
      out[key] = isSensitiveParam(key) ? '[REDACTED]' : params[key];
    });
    return out;
  }
  if (typeof params !== 'string' || !params.length) return params;
  return params.split('&').map((pair) => {
    const separator = pair.indexOf('=');
    if (separator < 0) return pair;
    return isSensitiveParam(pair.slice(0, separator)) ? `${pair.slice(0, separator)}=[REDACTED]` : pair;
  }).join('&');
}

function redactHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers;
  const out = {};
  Object.keys(headers).forEach((key) => {
    out[key] = isSensitiveHeader(key) ? '[REDACTED]' : headers[key];
  });
  return out;
}

function populateServerData(dataParam) {
  const data = dataParam;
  const request = cls.get('request');
  const response = cls.get('response');
  data.data.request = data.data.request || {};
  data.data.response = data.data.response || {};

  data.log.uuid = cls.get("uuid") || "";

  // Express rewrites `url` relative to the router mount point; `originalUrl` is the full path.
  const url = request.originalUrl || request.url || '';
  const indexOfQuestionMark = url.indexOf('?');
  let endpoint = '';
  let params = '';
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
  data.data.request.params = redactParams(data.data.request.params || params);
  let headers = data.data.request.headers || request.headers || {};
  if (data.data.request.params && typeof data.data.request.params === 'object') {
    data.data.request.params = JSON.stringify(data.data.request.params);
  }
  if (typeof headers === 'string') {
    try {
      headers = JSON.parse(headers);
    } catch (error) {
      headers = {};
    }
  }
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) headers = {};
  data.data.request.headers = JSON.stringify(redactHeaders(headers));
  data.data.request.params = data.data.request.params.substring(0, fieldLimits.PARAMS) || '';


  data.data.request.headers = data.data.request.headers.substring(0, fieldLimits.HEADERS) || '';

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

  data.log.dynamic_data = data.log.dynamic_data.substring(0, fieldLimits.DYNAMIC_DATA) || '';

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
module.exports.extendSensitiveHeaders = extendSensitiveHeaders;
module.exports.extendSensitiveParams = extendSensitiveParams;
