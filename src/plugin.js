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
 * @property {string} name - the name of the directive
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

/**
 * Return all plugin processors
 * @returns {Object.<string,Modifier>}
 */
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

  DirectivesRegistry.set(name, { type, predicate: typeChecker, callback });
};

/**
 * Add directive
 * @param  {...Directive} directives
 * @returns
 */
const addDirective = (...directives) =>
  directives.forEach((dir) => registerDirective(dir));

/**
 * Remove a directive
 * @param  {...string} names
 * @returns
 */
const removeDirective = (...names) =>
  names.forEach((name) => DirectivesRegistry.delete(name));

// ============= LIFECYCLE =============
let processors = [];

/**
 * Add a callback that will process the html string before creation
 * @param  {...Function|Function[]} callback
 * @returns
 */
const onBeforeCreate = (...callback) => processors.push(...callback);

/**
 * Remove a processor callback
 * @param {Function} callback
 */
const removeOnBeforeCreate = (callback) => {
  processors = processors.filter((fn) => fn !== callback);
};

const runBeforeCreate = (htmlString) =>
  processors.reduce(
    (result, fn) => (isArray(fn) ? compose(...fn)(result) : fn(result)),
    htmlString
  );

export {
  addDirective,
  removeDirective,
  onBeforeCreate,
  removeOnBeforeCreate,
  runBeforeCreate,
  getPlugins,
  getAdditionalAttrDirectives,
  getAdditionalKeyDirectives,
};
