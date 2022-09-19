import { modifyElement } from './modify';
import { HOOK_REF } from './constants';
import { isHook } from './utils/is';
import { compose, resolve } from './utils/general';
import { uid } from './utils/id';
import isPlainObject from './utils/is-plain-obj';

const HooksRegistry = new WeakMap();

/**
 * Creates a hook
 * @param {any} value - the initial value of the hook
 * @param {Boolean} [seal=true] - seal the object with Object.seal
 * @returns {any}
 */
const createHook = (value, seal = true) => {
  let obj = isPlainObject(value) ? value : { value };
  obj = seal ? Object.seal(obj) : obj;
  HooksRegistry.set(obj, new Map());

  const proxy = new Proxy(obj, {
    get: getter,
    set: setter,
  });

  return proxy;
};

const methodForwarder = (target, prop) => {
  const previousTrap = target.data.trap || ((value) => value);

  const callback = (...args) => {
    const copy = {
      [HOOK_REF]: target[HOOK_REF],
      data: {
        ...target.data,
        trap: compose(previousTrap, (value) => value[prop](...args)),
      },
    };

    return new Proxy(copy, { get: methodForwarder });
  };

  // methodForwarder is only for hook/hookFn
  // so we're either getting a function or the HOOK_REF or data
  // and for user's part, if they are accessing something out of a hook
  // we assume that they're getting a function
  // this is to avoid invoking the callbacks passed
  if ([HOOK_REF, 'data'].includes(prop)) return target[prop];
  return callback;
};

const createHookFunction = (ref, prop, value) => {
  const fn = (trap = null) => ({
    [HOOK_REF]: ref,
    data: {
      prop,
      trap,
      value,
    },
  });

  return new Proxy(Object.assign(fn, fn()), { get: methodForwarder });
};

const getter = (target, rawProp, receiver) => {
  const prop = rawProp.replace(/^\$/, '');

  if (rawProp.startsWith('$') && prop in target) {
    return createHookFunction(target, prop, target[prop]);
  }

  return Reflect.get(target, prop, receiver);
};

const setter = (target, prop, value, receiver) => {
  const bindedElements = HooksRegistry.get(target);

  bindedElements.forEach((handlers, id) => {
    const element = document.querySelector(`[data-proxyid="${id}"]`);

    // check if element exists otherwise remove handlers
    if (element) {
      handlers
        .filter((handler) => handler.linkedProp === prop)
        .forEach((handler) => {
          modifyElement(element, handler.type, {
            key: handler.targetAttr,
            value: resolve(value, handler.action),
          });
        });
    } else {
      bindedElements.delete(id);
    }
  });

  return Reflect.set(target, prop, value, receiver);
};

/**
 * Register the value if hook. Returns resolved value.
 * @param {any} value
 * @param {Object} options
 * @param {HTMLElement} options.element - the element to bind to
 * @param {string} options.type - type of modification to make
 * @param {string} options.target - the attribute or prop to modify
 * @returns {any}
 */
const registerIfHook = (value, options) => {
  if (!isHook(value)) return value;

  const hook = value;
  const id = options.element.dataset.proxyid || uid();
  options.element.dataset.proxyid = id;

  if (['listener', 'lifecycle'].includes(options.type))
    throw new Error(
      "You can't dynamically set lifecycle methods or event listeners"
    );

  const bindedElements = HooksRegistry.get(hook[HOOK_REF]);
  const handler = {
    type: options.type,
    linkedProp: hook.data.prop,
    targetAttr: options.target,
    action: hook.data.trap,
  };

  // store handler
  bindedElements.set(id, [...(bindedElements.get(id) || []), handler]);

  // delete handlers when deleted
  options.element.addEventListener('@destroy', () => bindedElements.delete(id));

  return resolve(hook.data.value, hook.data.trap);
};

export { createHook, registerIfHook };
