/* eslint-disable import/no-import-module-exports */
import { compose } from './utils/general';
import { isArray, isFunction } from './utils/is';
import isPlainObject from './utils/is-plain-obj';

/**
 * @callback DirectivePredicate
 * @param {string} key - the string to be processed
 * @returns {[string,string|null]|null}
 */

/**
 * @callback Modifier
 * @param {HTMLElement} element - the element to be modified
 * @param {{key: string, value: any}} data - the data
 * @param {Function} modify - the internal helper function used by poor-man-jsx to modify elements based on directives
 * @returns {void}
 */

/**
 * @typedef {Object} Directive
 * @property {string} [name] - the name of the directive. This will serve as the id for the directive to be able to remove it later. If not provided, will default to `type`.
 * @property {string} type - the id of the directive
 * @property {DirectivePredicate|DirectivePredicate[]|{ attrName: DirectivePredicate, objKey: DirectivePredicate }} [predicate] - callbacks used to determine the type based from attr name or object key
 * @property {Modifier} callback - the function to modify the element based on type
 */

// ============= DIRECTIVES =============

const DirectivesRegistry = new Map();

const getAdditionalAttrDirectives = () =>
  [...DirectivesRegistry.values()]
    .map((dir) => dir.predicate.attrName)
    .filter((fn) => fn);

const getAdditionalKeyDirectives = () =>
  [...DirectivesRegistry.values()]
    .map((dir) => dir.predicate.objKey)
    .filter((fn) => fn);

const getPlugins = () => {
  const map = {};
  for (const data of DirectivesRegistry.values()) {
    map[data.type] = data.callback;
  }

  return map;
};

const createPredicate = (type, fn) => (key) =>
  (fn ? fn(key) : key === type) && [type, key];

const registerDirective = ({ name, type, predicate, callback }) => {
  const typeChecker = {
    attrName: null,
    objKey: null,
  };

  if (!predicate) {
    typeChecker.attrName = createPredicate(type);
    typeChecker.objKey = createPredicate(type);
  } else if (isFunction(predicate)) {
    typeChecker.attrName = createPredicate(type, predicate);
    typeChecker.objKey = createPredicate(type, predicate);
  } else if (isArray(predicate)) {
    typeChecker.attrName = createPredicate(type, predicate[0]);
    typeChecker.objKey = createPredicate(type, predicate[1]);
  } else if (isPlainObject(predicate)) {
    typeChecker.attrName = createPredicate(type, predicate.attrName);
    typeChecker.objKey = createPredicate(type, predicate.objKey);
  }

  DirectivesRegistry.set(name || type, {
    type,
    predicate: typeChecker,
    callback,
  });
};

/**
 * Add directive
 * @param  {...Directive} directives
 */
const addDirective = (...directives) => {
  directives.forEach((dir) => registerDirective(dir));
};

/**
 * Remove a directive
 * @param  {...string} names
 */
const removeDirective = (...names) => {
  names.forEach((name) => DirectivesRegistry.delete(name));
};

// ============= LIFECYCLE =============
const lifecycle = {
  beforeCreate: [],
  afterCreate: [],
  beforeHydrate: [],
  afterHydrate: [],
};

const exports = Object.keys(lifecycle).reduce((o, key) => {
  const name = key[0].toUpperCase() + key.slice(1);

  const add = (...callback) => lifecycle[key].push(...callback);
  const remove = (callback) => {
    lifecycle[key] = lifecycle[key].filter((fn) => fn !== callback);
  };
  const run = (...args) => lifecycle[key].forEach((fn) => fn(...args));

  o[`on${name}`] = add;
  o[`remove${name}`] = remove;
  o[`run${name}`] = run;

  return o;
}, {});

exports.runBeforeCreate = (htmlString) =>
  lifecycle.beforeCreate.reduce(
    (result, fn) => (isArray(fn) ? compose(...fn)(result) : fn(result)),
    htmlString
  );

export {
  addDirective,
  removeDirective,
  getAdditionalAttrDirectives,
  getAdditionalKeyDirectives,
  getPlugins,
  exports as lifecycle,
};
