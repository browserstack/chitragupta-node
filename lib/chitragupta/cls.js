const cls = require('cls-hooked');
const constants = require('./constants');

const ns = cls.createNamespace(constants.CHITRAGUPTA_CLS_ID);

function get(key) {
  let returnVal = null;
  if (ns && ns.active) {
    returnVal = ns.get(key);
  }
  return returnVal;
}

function set(key, value) {
  let returnVal = null;
  if (ns && ns.active) {
    returnVal = ns.set(key, value);
  }
  return returnVal;
}

module.exports = {
  get,
  set,
  ns,
};
