import { modifyElement } from './modify';

/**
 * Hydrates elements from handlers
 * @param {HTMLElement} context - the context where querySelector will be called
 * @param {Array.<Handler>} handlers
 * @returns
 */
export const hydrate = (context, handlers = []) =>
  handlers.forEach((handler) => {
    const node = modifyElement(
      handler.selector,
      handler.type,
      handler.data,
      context
    );

    if (handler.remove) node.removeAttribute(handler.attr);
  });
