import { BOOLEAN_ATTRS, LIFECYCLE_METHODS } from './constants';
import { isArray, isFunction } from './utils/is';
import isPlainObject from './utils/is-plain-obj';

/**
 * @callback DirectiveType
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
 * @property {DirectiveType|DirectiveType[]|{ attrName: DirectiveType, objKey: DirectiveType }} getType - callbacks used to determine the type based from attr name or object key
 * @property {Modifier} callback - the function to modify the element based on type
 */

const attrNameDirectives = [
  (key) => ['on', 'class', 'style'].includes(key) && key,
  (key) =>
    key.startsWith('style:') && ['style:prop', key.replace('style:', '')],
  (key) =>
    key.startsWith('class:') && ['class:name', key.replace('class:', '')],
  (key) => {
    const k = key.toLowerCase().trim();
    const name = k.replace('on', '');
    return k.startsWith('on') && LIFECYCLE_METHODS.includes(name)
      ? ['lifecycle', name]
      : null;
  },
  (key) =>
    key.toLowerCase().startsWith('on') && key !== 'on'
      ? ['listener', key.replace('on', '').toLowerCase()]
      : null,
  (key) => {
    // remove modifiers
    const [k] = key.split('.');

    return BOOLEAN_ATTRS.includes(k) || k.startsWith('toggle:')
      ? ['toggle', key.replace('toggle:', '')]
      : null;
  },
  (key) => key === ':key' && 'key',
  (key) => key === ':skip' && 'skip',
  (key) => key === ':text' && 'text',
  (key) => key === ':html' && 'html',
  (key) => key === ':children' && 'children',
  (key) => key === ':ref' && 'ref',
  (key) => key.startsWith(':show') && ['show', key.replace(':show', '')],
  (key) => key === ':if' && 'if',
];

// Reserved object keys
const objKeyDirectives = [
  (key) => key === 'textContent' && 'text',
  (key) => key === 'innerHTML' && 'html',
  (key) => key === 'html' && 'html',
  (key) => key === 'children' && 'children',
  (key) => key === '_key' && 'key',
  (key) => key === '_skip' && 'skip',
  (key) => key === '_ref' && 'ref',
  (key) => key === '_show' && ['show', key.replace('_show', '')],
];

const getAttrDirectives = () => [...attrNameDirectives];

const getKeyDirectives = () => [...objKeyDirectives];

// ================= PLUGINS =======================

const PluginRegistry = new Map();

const getAdditionalAttrDirectives = () =>
  [...PluginRegistry.values()]
    .map((dir) => dir.getType.attrName)
    .filter((fn) => fn);

const getAdditionalKeyDirectives = () =>
  [...PluginRegistry.values()]
    .map((dir) => dir.getType.objKey)
    .filter((fn) => fn);

/**
 * Return all plugin processors
 * @returns {Object.<string,Modifier>}
 */
const getPlugins = () => {
  const map = {};
  for (const data of PluginRegistry.values()) {
    map[data.type] = data.callback;
  }

  return map;
};

const registerDirective = ({ name, type, getType, callback }) => {
  const typeChecker = {
    attrName: null,
    objKey: null,
  };

  if (!getType) {
    const check = (str) => (str === type ? [type, type] : null);
    typeChecker.attrName = check;
    typeChecker.objKey = check;
  } else if (isFunction(getType)) {
    typeChecker.attrName = getType;
    typeChecker.objKey = getType;
  } else if (isArray(getType)) {
    typeChecker.attrName = getType[0];
    typeChecker.objKey = getType[1];
  } else if (isPlainObject(getType)) {
    Object.assign(typeChecker, getType);
  }

  PluginRegistry.set(name, { type, getType: typeChecker, callback });
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
  names.forEach((name) => PluginRegistry.delete(name));

export {
  addDirective,
  removeDirective,
  getPlugins,
  getAttrDirectives,
  getKeyDirectives,
  getAdditionalAttrDirectives,
  getAdditionalKeyDirectives,
};
