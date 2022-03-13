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
  const previousValue = target.data.value;

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

  // run previousTrap against previousValue to determine
  // what the latest value should be
  // This can cause weird behaviors if methods mutates the value
  // like `reverse` in array
  // in general, mutations should be discouraged inside traps
  if (typeof previousTrap(previousValue)[prop] === 'function') return callback;
  return Reflect.get(target, prop);
};

const getter = (target, rawProp, receiver) => {
  const [prop, type] = getType(rawProp);
  const hook = createHookFunction(target, prop, target[prop]);

  if (type === 'hook' && prop in target) {
    return Object.assign(new Proxy(hook, { get: methodForwarder }), hook());
  }

  return Reflect.get(target, prop, receiver);
};

const setter = (target, prop, value, receiver) => {
  const bindedElements = Hooks.get(target);

  bindedElements.forEach((handlers, id) => {
    handlers
      .filter((handler) => handler.prop === prop)
      .forEach((handler) => {
        modifyElement(`[data-proxyid="${id}"]`, handler.type, {
          name: handler.target,
          value: resolve(value, handler.trap),
        });
      });
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
