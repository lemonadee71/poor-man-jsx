const uuid = (length = 8) => Math.random().toString(36).substr(2, length);

const stateStore = new Map();
const defaultProps = ['textContent', 'innerHTML', 'outerHTML'];
const booleanAttributes = [
  'checked',
  'selected',
  'disabled',
  'readonly',
  'multiple',
  'ismap',
  'noresize',
  'reversed',
  'autocomplete',
];

const isObject = (val) => typeof val === 'object';
const isArray = (val) => Array.isArray(val);
const isTemplateObject = (val) => isObject(val) && val.type;
const isTemplate = (val) => val._type && val._type === 'template';
const isEventListeners = (val) =>
  isObject(val) && Object.keys(val).every((key) => key.startsWith('on'));
const isState = (val) =>
  isObject(val) && Object.keys(val).every((key) => key.startsWith('$'));
const isBooleanAttribute = (val) => booleanAttributes.includes(val);
const isStyleAttribute = (str) => str.startsWith('$style:');

const _handlerTypeReducer = (str) => {
  let type;
  if (defaultProps.includes(str.replace('$', ''))) {
    type = 'prop';
  } else if (isStyleAttribute(str)) {
    type = 'style';
  } else if (str.replace('$', '') === 'content') {
    type = 'content';
  } else {
    type = 'attr';
  }

  return type;
};

const _handlerValueReducer = (type, obj) => {
  switch (type) {
    case 'listener':
      return {
        name: obj[0].replace('on', '').toLowerCase(),
        value: obj[1],
      };
    case 'prop':
      return {
        name: obj[0].replace('$', ''),
        value: obj[1],
      };
    case 'attr':
      return {
        name: obj[0].replace('$', ''),
        value: obj[1],
      };
    case 'style':
      return {
        name: obj[0],
        value: obj[1],
      };
    case 'text':
      return {
        value: obj[1],
      };
    case 'content':
      return {
        value: obj[1],
      };
    default:
      throw new Error('Invalid handler type.');
  }
};

const _generateHandler = (type, obj) => {
  const arr = [];
  const id = uuid();
  const attrName = `data-${type}-id`;
  const dataAttr = `${attrName}="${id}"`;

  Object.entries(obj).forEach((item) => {
    arr.push({
      type,
      query: `[${dataAttr}]`,
      data: _handlerValueReducer(type, item),
      attr: attrName,
      remove: false,
    });
  });

  arr[arr.length - 1].remove = true;

  return [arr, dataAttr];
};

const _bindState = (state) => {
  const id = uuid();
  const proxyId = `data-proxy-id="${id}"`;
  const handlers = {};

  Object.entries(state).forEach(([key, handler]) => {
    const bindedElements = stateStore.get(handler._id);
    const existingHandlers = bindedElements.get(id) || [];

    const finalValue = handler.trap
      ? handler.trap.call(null, handler.value)
      : handler.value;
    const target = key.replace('$style:', '').replace('$', '');
    const type = _handlerTypeReducer(key);

    // Store the new handlers
    bindedElements.set(id, [
      ...existingHandlers,
      {
        type,
        target,
        propName: handler.propName,
        trap: handler.trap,
      },
    ]);

    if (!handlers[type]) {
      handlers[type] = {};
    }

    handlers[type][target] = finalValue;
  });

  const [allHandlers, str] = Object.entries(handlers)
    .map(([type, obj]) => _generateHandler(type, obj))
    .reduce(
      (prev, current) => [
        [...prev[0], ...current[0]],
        [...prev[1], current[1]],
      ],
      [[], []]
    );

  return [allHandlers, `${proxyId} ${str.join(' ')}`];
};

// return value is [str, array]
const _parser = (expr, handlers = []) => {
  // if expr is array, map and parse each item
  // items must be all strings after parsing
  if (isArray(expr)) {
    const [strArray, handlersArray] = expr
      .map((item) => _parser(item, handlers))
      .reduce(
        (prev, current) => [
          [...prev[0], current[0]],
          [...prev[1], ...current[1]],
        ],
        [[], []]
      );

    return [strArray.join(''), handlersArray];
  }

  // if template
  // add its handlers to ours
  // then return the string
  if (isTemplate(expr)) {
    return [expr[0], [...handlers, ...expr[1]]];
  }

  // if TemplateObject parse it with objectToString
  // if (isTemplateObject(expr)) {
  //   return _parser(objectToString(expr), handlers);
  // }

  // if Object and that object contains only keys which name is an event
  // generate a temporary id and replace the object with it
  // then add the event listeners to our handlers
  if (isEventListeners(expr)) {
    const [eventHandlers, id] = _generateHandler('listener', expr);

    return [id, [...handlers, ...eventHandlers]];
  }

  if (isState(expr)) {
    const [propHandlers, id] = _bindState(expr);
    return [id, [...handlers, ...propHandlers]];
  }

  // if none of our accepted types, assume it is string
  // then just return it
  return [`${expr}`, []];
};

const _createTemplate = (arr) => {
  const arrayLikeObj = {};

  arr.forEach((i, idx) => {
    arrayLikeObj[idx] = arr[idx];
  });

  arrayLikeObj.length = arr.length;
  arrayLikeObj._type = 'template';

  Object.defineProperty(arrayLikeObj, '_type', {
    enumerable: false,
  });

  return arrayLikeObj;
};

const _replacePlaceholders = (str) => {
  let newString = str;
  let match = newString.match(/{%\s*(.*)\s*%}/);
  const handlers = [];

  while (match) {
    const [textHandlers, id] = _generateHandler('text', {
      text: match[1].trim(),
    });

    handlers.push(...textHandlers);

    newString = newString.replace(match[0], `<a ${id}></a>`);

    match = newString.slice(match.index).match(/{%\s*(.*)\s*%}/);
  }

  return [newString, handlers];
};

const parseString = (strings, ...exprs) => {
  const [evaluatedExprs, handlers] = exprs
    .map((expr) => _parser(expr))
    .reduce(
      (prev, current) => [
        [...prev[0], current[0]],
        [...prev[1], ...current[1]],
      ],
      [[], []]
    );

  const htmlString = evaluatedExprs.reduce(
    (fullString, expr, i) => `${fullString}${expr}${strings[i + 1]}`,
    strings[0]
  );

  const [sanitizedString, textHandlers] = _replacePlaceholders(htmlString);
  handlers.push(...textHandlers);

  return _createTemplate([sanitizedString, handlers]);
};

const html = (strings, ...exprs) => parseString(strings, ...exprs);

const _modifyElement = ({ element, type, data, context = document }) => {
  const el = context.querySelector(element);

  switch (type) {
    case 'prop':
      el[data.name] = data.value;
      break;
    case 'attr':
      if (isBooleanAttribute(data.name)) {
        if (data.value) {
          el.setAttribute(data.name, '');
        } else {
          el.removeAttribute(data.name);
        }
      } else {
        el.setAttribute(data.name, data.value);
      }

      break;
    case 'listener':
      el.addEventListener(data.name, data.value);
      break;
    case 'text':
      el.replaceWith(document.createTextNode(data.value));
      break;
    case 'style':
      el.style[data.name] = data.value;
      break;
    case 'content':
      [...el.children].map((child) => child.remove());

      el.appendChild(
        data.value instanceof HTMLElement
          ? data.value
          : render(html`${data.value}`)
      );

      break;
    default:
      throw new Error('Invalid type.');
  }
};

const createElementFromString = (str, handlers = []) => {
  const createdElement = document.createRange().createContextualFragment(str);

  handlers.forEach((handler) => {
    const el = createdElement.querySelector(handler.query);

    _modifyElement({
      element: handler.query,
      type: handler.type,
      data: handler.data,
      context: createdElement,
    });

    if (handler.remove && el) {
      el.removeAttribute(handler.attr);
    }
  });

  return createdElement;
};

const render = (template) => createElementFromString(...Array.from(template));

const _setHandler = (stateId) => ({
  set: (target, prop, value, receiver) => {
    const bindedElements = stateStore.get(stateId);

    bindedElements.forEach((handlers, id) => {
      const query = `[data-proxy-id="${id}"]`;
      const el = document.querySelector(query);

      if (el) {
        handlers.forEach((handler) => {
          if (prop !== handler.propName) return;

          const finalValue = handler.trap
            ? handler.trap.call(null, value)
            : value;

          _modifyElement({
            element: query,
            type: handler.type,
            data: { name: handler.target, value: finalValue },
          });
        });
      } else {
        // delete handler when the target is unreachable (most likely deleted)
        bindedElements.delete(id);
      }
    });

    return Reflect.set(target, prop, value, receiver);
  },
});

const createState = (initValue = null) => {
  const _id = uuid();
  // Map contains id keys
  // id keys are proxy ids of elements binded to the state
  stateStore.set(_id, new Map());

  const state = {
    bindValue: (trap = null) => ({
      propName: 'value',
      trap,
      _id,
      value: state.value,
    }),
    bind: (propName = 'value', trap = null) => ({
      propName,
      trap,
      _id,
      value: propName === 'value' ? state.value : state.value[propName],
    }),
  };

  if (isObject(initValue)) {
    state.value = new Proxy(initValue, _setHandler(_id));
  } else {
    state.value = initValue;
  }

  return new Proxy(state, _setHandler(_id));
};

// const objectToString = (template) => {
//   const { type, id, className, attr, children, text, prop, listeners, style } =
//     template;
//   const handlers = [];

//   const idStr = id ? ` id="${id}" ` : '';
//   const classStr = className ? ` class="${className}"` : '';

//   const styleStr = style
//     ? ` style="${Object.keys(style)
//         .map((type) => (style[type] ? `${type}: ${style[type]};` : ''))
//         .join(' ')}"`
//     : '';

//   const attrStr = attr
//     ? Object.keys(attr)
//         .map((type) => (attr[type] ? `${type}="${attr[type]}"` : ''))
//         .join(' ')
//     : '';

//   const childrenStr = Array.isArray(children)
//     ? _parser(children, handlers)
//     : '';

//   let eventPlaceholder = '';
//   if (listeners) {
//     const [eventHandlers, id] = _generateHandler('listener', listeners);
//     handlers.push(...eventHandlers);
//     eventPlaceholder = id;
//   }

//   let textPlaceholder = '';
//   if (text) {
//     const [textHandler, id] = _generateHandler('text', text);
//     handlers.push(textHandler);
//     textPlaceholder = id;
//   }

//   let propPlaceholder = '';
//   if (prop) {
//     let [propHandlers, id] = _generateHandler('prop', prop);
//     handlers.push(...propHandlers);
//     propPlaceholder = id;
//   }

//   const htmlString = `<${type} ${textPlaceholder} ${propPlaceholder} ${eventPlaceholder}
//     ${idStr} ${classStr} ${attrStr} ${styleStr}>
//     ${childrenStr}</${type}>`;

//   return _createTemplate([htmlString, handlers]);
// };

export { html, render, createElementFromString, createState };
