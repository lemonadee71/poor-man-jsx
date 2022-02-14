/**
 * @typedef {Object} DataObject
 * @property {string} name
 * @property {*} value
 */

/**
 * Instructions on how to update an element
 * @typedef {Object} Handler
 * @property {string} type
 * @property {string} selector
 * @property {string} attr - the attribute name
 * @property {Boolean} [remove=false] - whether to remove the attr after execution
 * @property {DataObject} - the data
 */
