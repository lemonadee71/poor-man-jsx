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
