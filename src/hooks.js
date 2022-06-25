import { isHook, isObject } from './utils/is';
import { getType } from './utils/type';
import { modifyElement } from './utils/modify';
import { uid, compose, resolve } from './utils/util';
import { REF } from './constants';

const Hooks = new WeakMap();

/**
 * Creates a hook
 * @param {any} value - the initial value of the hook
 * @param {Boolean} [seal=true] - seal the object with Object.seal
 * @returns {[Object, function]}
 */
const createHook = (value, seal = true) => {
  let obj = isObject(value) ? value : { value };
  obj = seal ? Object.seal(obj) : obj;
  Hooks.set(obj, new Map());

  const { proxy, revoke } = Proxy.revocable(obj, {
    get: getter,
    set: setter,
  });

  /**
   * Delete the hook object and returns the original value
   * @returns {any}
   */
  const deleteHook = () => {
    revoke();
    Hooks.delete(obj);

    return value;
  };

  return [proxy, deleteHook];
};

const createHookFunction =
  (ref, prop, value) =>
  (trap = null) => ({
    [REF]: ref,
    data: {
      prop,
      trap,
      value,
    },
  });

const methodForwarder = (target, prop) => {
  const dummyFn = (value) => value;
  const previousTrap = target.data.trap || dummyFn;

  const callback = (...args) => {
    const copy = {
      [REF]: target[REF],
      data: {
        ...target.data,
        trap: compose(previousTrap, (value) => value[prop](...args)),
      },
    };

    return new Proxy(copy, { get: methodForwarder });
  };

  // methodForwarder is only for hook/hookFn
  // so we're either getting a function or the REF or data
  // and for user's part, if they are accessing something out of a hook
  // we assume that they're getting a function
  // this is to avoid invoking the callbacks passed
  if ([REF, 'data'].includes(prop)) return target[prop];
  return callback;
};

const getter = (target, rawProp, receiver) => {
  const [prop, type] = getType(rawProp);
  let hook = createHookFunction(target, prop, target[prop]);
  hook = Object.assign(hook, hook());

  if (type === 'hook' && prop in target) {
    return new Proxy(hook, { get: methodForwarder });
  }

  return Reflect.get(target, prop, receiver);
};

const setter = (target, prop, value, receiver) => {
  const bindedElements = Hooks.get(target);

  bindedElements.forEach((handlers, id) => {
    const el = document.querySelector(`[data-proxyid="${id}"]`);

    // check if element exists
    // otherwise remove handlers
    if (el) {
      handlers
        .filter((handler) => handler.prop === prop)
        .forEach((handler) => {
          modifyElement(el, handler.type, {
            name: handler.target,
            value: resolve(value, handler.trap),
          });
        });
    } else {
      bindedElements.delete(id);
    }
  });

  return Reflect.set(target, prop, value, receiver);
};

/**
 * Add hooks to a DOM element
 * @param {HTMLElement} target - the element to add hooks to
 * @param {Object} hooks - object that has hooks as values
 * @returns {HTMLElement}
 */
const addHooks = (target, hooks) => {
  const id = target.dataset.proxyid || uid();
  target.dataset.proxyid = id;

  Object.entries(hooks).forEach(([rawKey, value]) => {
    if (!isHook(value)) throw new TypeError('Value must be a hook');

    const [key, type] = getType(rawKey);

    if (['listener', 'lifecycle'].includes(type))
      throw new Error(
        "You can't dynamically set lifecycle methods or event listeners"
      );

    const bindedElements = Hooks.get(value[REF]);
    const handlers = bindedElements.get(id) || [];
    const handler = {
      type,
      target: key,
      prop: value.data.prop,
      trap: value.data.trap,
    };

    // store handler
    bindedElements.set(id, [...handlers, handler]);

    // delete handlers when deleted
    target.addEventListener('@destroy', () => bindedElements.delete(id));

    // init values
    modifyElement(target, handler.type, {
      name: handler.target,
      value: resolve(value.data.value, handler.trap),
    });
  });

  return target;
};

export { createHook, addHooks };
