import { modifyElement } from './modify';

/**
 * Hydrates elements from handlers
 * @param {HTMLElement} context - the context where querySelector will be called
 * @param {Array.<Handler>} handlers
 * @returns
 */
export const hydrate = (context, handlers = []) =>
  handlers.forEach((handler) => {
    const el = context.querySelector(handler.selector);

    if (!el) {
      throw new Error(`Can't find node using selector ${handler.selector}.`);
    }

    modifyElement(handler.selector, handler.type, handler.data, context);

    if (handler.remove) el.removeAttribute(handler.attr);
  });
