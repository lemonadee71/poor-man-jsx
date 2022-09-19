import { compose, resolve } from './general';
import { uid } from './id';
import { getKey, setMetadata } from './meta';

/**
 * Append a callback to the hook
 * @param {any} hook
 * @param {Function} callback
 * @returns {any}
 */
export const addTrap = (hook, callback) => {
  const previousTrap = hook.data.trap;
  hook.data.trap = compose((value) => resolve(value, previousTrap), callback);

  return hook;
};

/**
 * Get the index of bounding comment markers
 * @param {string} id
 * @param {Node[]} nodes
 * @returns {[number, number]}
 */
export const getBoundary = (id, nodes) => {
  const start = nodes.findIndex((n) => getKey(n) === `start_${id}`);
  const end = nodes.findIndex((n) => getKey(n) === `end_${id}`);

  return [start + 1, end];
};

/**
 * Create marker comments to easily mark the start and end
 * of where the hook is passed in the body
 * @returns {[Comment,Comment,string]}
 */
export const createMarkers = () => {
  const id = uid();

  // Use comments to easily mark the start and end
  // of where we should insert our children
  const head = document.createComment('MARKER');
  const tail = document.createComment('END');
  setMetadata(head, 'key', `start_${id}`);
  setMetadata(tail, 'key', `end_${id}`);

  return [head, tail, id];
};
