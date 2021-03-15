const CLS = require('cls-hooked');
const CONSTANTS = require('./constants');

const NS = CLS.createNamespace(CONSTANTS.CHITRAGUPTA_CLS_ID);

function get(key) {
  let returnVal = null;
  if (NS && NS.active) {
    returnVal = NS.get(key);
  }
  return returnVal;
}

function set(key, value) {
  let returnVal = null;
  if (NS && NS.active) {
    returnVal = NS.set(key, value);
  }
  return returnVal;
}

module.exports = {
  get,
  set,
  NS,
};
