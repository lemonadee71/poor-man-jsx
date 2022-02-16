import { uid } from './util';

const generatePlaceholder = (type) => {
  const id = uid();
  const seed = uid(4);
  const attrName = `data-${type}-${seed}`;
  const dataAttr = `${attrName}="${id}"`;

  return [dataAttr, attrName];
};

export const generateHandler = (type, obj) => {
  const [dataAttr, attrName] = generatePlaceholder(type);
  const handlers = [];

  Object.entries(obj).forEach(([name, value]) => {
    handlers.push({
      type,
      selector: `[${dataAttr}]`,
      attr: attrName,
      data: { name, value },
      remove: false,
    });
  });

  handlers[handlers.length - 1].remove = true;

  return { str: dataAttr, handlers };
};

export const generateHandlerAll = (batched) =>
  reduceHandlers(
    Object.entries(batched).map((args) => generateHandler(...args))
  );

export const reduceHandlers = (arr) =>
  arr.reduce(
    (acc, item) => {
      acc.str.push(item.str);
      acc.handlers.push(...item.handlers);
      acc.dict = { ...acc.dict, ...item.dict };

      return acc;
    },
    { str: [], handlers: [], dict: {} }
  );
