import { generateHandler } from './handler';
import {
  isDefaultProp,
  isEventListener,
  isHook,
  isLifecycleMethod,
  isStyleAttribute,
} from './is';
import { reduceTemplates } from './util';

export const getType = (key) => {
  // Any unrecognizable key will be treated as attr
  let type = 'attr';
  let k = key;

  if (isHook(key)) {
    type = 'hook';
  } else if (isLifecycleMethod(key)) {
    type = 'lifecycle';
  } else if (isEventListener(key)) {
    type = 'listener';
  } else if (isDefaultProp(key)) {
    type = 'prop';
  } else if (isStyleAttribute(key)) {
    type = 'style';
  } else if (key === 'children') {
    type = 'children';
  }

  if (type === 'listener' || type === 'lifecycle') {
    k = key.toLowerCase();
  }

  return [k.replace(/^(\$|@|on|style_)/gi, ''), type];
};

export const batchTypes = (obj) => {
  const batched = Object.entries(obj).reduce((acc, [rawKey, value]) => {
    const [key, type] = getType(rawKey);

    if (!acc[type]) acc[type] = {};
    acc[type][key] = value;

    return acc;
  }, {});

  if (batched.hook) batched.hook = batchTypes(batched.hook);

  return batched;
};

export const reduceBatchedObject = (batched) =>
  reduceTemplates(
    Object.entries(batched).map((args) => generateHandler(...args))
  );
