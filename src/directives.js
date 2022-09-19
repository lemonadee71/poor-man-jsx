import { BOOLEAN_ATTRS, LIFECYCLE_METHODS } from './constants';

const attrNameDirectives = [
  (key) => (['on', 'class', 'style'].includes(key) ? [key] : null),
  (key) => (key === ':key' ? ['key'] : null),
  (key) => (key === ':skip' ? ['skip'] : null),
  (key) => {
    const k = key.toLowerCase().trim();
    const name = k.replace('on', '');
    return k.startsWith('on') && LIFECYCLE_METHODS.includes(name)
      ? ['lifecycle', name]
      : null;
  },
  (key) =>
    key.toLowerCase().startsWith('on') && key !== 'on'
      ? ['listener', key.replace('on', '').toLowerCase()]
      : null,
  (key) => {
    // remove modifiers
    const [k] = key.split('.');

    return BOOLEAN_ATTRS.includes(k) || k.startsWith('bool:')
      ? ['bool', key.replace('bool:', '')]
      : null;
  },
  (key) =>
    key.startsWith('style:') ? ['style:prop', key.replace('style:', '')] : null,
  (key) =>
    key.startsWith('class:') ? ['class:name', key.replace('class:', '')] : null,
  (key) => (key.startsWith(':text') ? ['text'] : null),
  (key) => (key.startsWith(':html') ? ['html'] : null),
  (key) => (key.startsWith(':children') ? ['children'] : null),
  (key) => (key.startsWith(':show') ? ['show'] : null),
  (key) => (key.startsWith(':ref') ? ['ref'] : null),
];

// Reserved object keys
const objKeyDirectives = [
  (key) => (key === 'textContent' ? ['text'] : null),
  (key) => (key === 'innerHTML' ? ['html'] : null),
  (key) => (key === 'children' ? ['children'] : null),
  (key) => (key === 'key' ? ['key'] : null),
  (key) => (key === 'skip' ? ['skip'] : null),
];

const getAttrDirectives = () => [...attrNameDirectives];

const getKeyDirectives = () => [...objKeyDirectives];

export { getAttrDirectives, getKeyDirectives };
