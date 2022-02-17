import { render } from './main';
import { isHook, isTemplate } from './utils/is';
import { compose, rebuildString, resolve } from './utils/util';

/**
 * Render array of items
 * @param {Hook} hook
 * @param {?Function} callback
 * @returns {Hook}
 */
export const renderArray = (hook, callback = null) => {
  const previousTrap = hook.data.trap;

  hook.data.trap = compose(
    (value) => resolve(value, previousTrap),
    (value) =>
      value.map((...args) => {
        const result = callback ? callback(...args) : args[0];
        return isTemplate(result) ? render(result) : result;
      })
  );

  return hook;
};

/**
 * Return a value depending on what the hook evaluates to.
 * @example
 * hook.$value(value => value ? firstValue : secondValue)
 * @param {Hook} hook
 * @param {*} firstValue - value if true
 * @param {*} secondValue - value if false
 * @param {?Function} callback
 * @returns {Hook}
 */
export const ternary = (hook, firstValue, secondValue, callback = null) => {
  const previousTrap = hook.data.trap;

  hook.data.trap = compose(
    (value) => resolve(value, previousTrap),
    (value) => (resolve(value, callback) ? firstValue : secondValue)
  );

  return hook;
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
export const text = (fragments, ...values) => {
  const pos = values.findIndex(isHook);
  if (pos < 0) throw new Error('A hook is expected');

  const left = values.slice(0, pos);
  const right = values.slice(pos + 1);
  const hook = values[pos];
  const previousTrap = hook.data.trap;

  const regen = (value) => rebuildString(fragments, [...left, value, ...right]);

  hook.data.trap = previousTrap ? compose(previousTrap, regen) : regen;

  return hook;
};
