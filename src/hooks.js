import { uid } from './utils/id';
import { isObject } from './utils/is';
import { getType } from './utils/type';
import { modifyElement } from './utils/modify';
import { generateHandlerAll } from './utils/handler';
import { compose, rebuildString, resolve } from './utils/util';

const Hooks = new WeakMap();

// This is to hide the ref property an invoked hook returns
// which is a reference to the original object
// to make sure we won't be able to access it outside of its intended use
const REF = Symbol('ref');

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
    const selector = `[data-proxyid="${id}"]`;
    const el = document.querySelector(selector);

    if (el) {
      handlers
        .filter((handler) => handler.prop === prop)
        .forEach((handler) => {
          modifyElement(selector, handler.type, {
            name: handler.target,
            value: resolve(value, handler.trap),
          });
        });
    } else {
      // delete handler when the target is unreachable (most likely deleted)
      bindedElements.delete(id);
    }
  });

  return Reflect.set(target, prop, value, receiver);
};

const generateHookHandler = (hook = {}) => {
  const id = uid();
  const proxyId = `data-proxyid="${id}"`;
  const batchedObj = {};

  Object.entries(hook).forEach(([type, batch]) => {
    Object.entries(batch).forEach(([key, info]) => {
      const bindedElements = Hooks.get(info[REF]);
      const handlers = bindedElements.get(id) || [];

      if (!batchedObj[type]) {
        batchedObj[type] = {};
      }

      batchedObj[type][key] = resolve(info.data.value, info.data.trap);

      bindedElements.set(id, [
        ...handlers,
        {
          type,
          target: key,
          prop: info.data.prop,
          trap: info.data.trap,
        },
      ]);
    });
  });

  const { str, handlers } = generateHandlerAll(batchedObj);

  return { handlers, str: [...str, proxyId] };
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

  Object.entries(hooks).forEach(([rawKey, hook]) => {
    // check if hook
    let [key, type] = getType(rawKey);

    if (type !== 'hook') {
      throw new Error('Value must be a hook');
    }

    // then get the actual type
    [key, type] = getType(key);

    const bindedElements = Hooks.get(hook[REF]);
    const handlers = bindedElements.get(id) || [];
    const handler = {
      type,
      target: key,
      prop: hook.data.prop,
      trap: hook.data.trap,
    };

    // store handler
    bindedElements.set(id, [...handlers, handler]);

    // init values
    modifyElement(target, handler.type, {
      name: handler.target,
      value: resolve(hook.data.value, handler.trap),
    });
  });

  return target;
};

/**
 * Helper for hooks. Only one hook can be passed.
 * @example
 * // To format a string, we will do
 * html`<h1 ${{ $textContent: hook.$str((value) => `The string is ${value}`) }}></h1>`
 * // but with `text`, we can instead do this to make it more concise
 * html`<h1 ${{ $textContent: text`The string is ${hook.$str}` }}></h1>`;
 *
 * @param {Array.<string>} fragments
 * @param  {...any} values
 * @returns
 */
const text = (fragments, ...values) => {
  const pos = values.findIndex((value) => value[REF]);
  if (pos < 0) throw new Error('A hook is expected');

  const left = values.slice(0, pos);
  const right = values.slice(pos + 1);
  const hook = values[pos];
  const previousTrap = hook.data.trap;

  const regen = (value) => rebuildString(fragments, [...left, value, ...right]);

  hook.data.trap = previousTrap ? compose(previousTrap, regen) : regen;

  return hook;
};

export { createHook, addHooks, generateHookHandler, text };