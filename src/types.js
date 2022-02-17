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

/**
 * @typedef {Object} HookData
 * @property {string} prop - the object property that will be observed; changing this prop's value will trigger the hook.
 * @property {any} value - the value of the object[prop]
 * @property {?Function} trap - the callback that will be called on the value
 */

/**
 * @typedef {Object} Hook
 * @property {HookData} data
 */

/**
 * @callback HookFunction
 * @param {?Function} trap - the callback to be called on the hook value
 * @returns {Hook}
 */
