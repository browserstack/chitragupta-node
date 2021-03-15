'use strict';

const CLS = require('cls-hooked');
const CONSTANTS = require('./constants');

const NS = CLS.createNamespace(CONSTANTS.CHITRAGUPTA_CLS_ID);

function get(key) {
  if (NS && NS.active) {
    return NS.get(key);
  }
}

function set(key, value) {
  if (NS && NS.active) {
    return NS.set(key, value);
  }
}

module.exports = {
  get: get,
  set: set,
  NS: NS,
}
