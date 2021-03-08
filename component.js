const Component = (() => {
  const dataStore = new Map();

  const createElementFromString = (str, handlers = []) => {
    let createdElement = document.createRange().createContextualFragment(str);

    handlers.forEach((handler) => {
      let el = createdElement.querySelector(handler.query);

      if (handler.type === 'prop') {
        el[handler.propName] = handler.value;
      } else if (handler.type === 'attribute') {
        el.setAttribute(handler.attrName, handler.value);
      } else if (handler.type === 'listener') {
        el.addEventListener(handler.eventName, handler.callback);
      } else if (handler.type === 'text') {
        el.prepend(document.createTextNode(handler.value));
      }

      if (handler.remove) {
        el.removeAttribute(handler.attr);
      }
    });

    return createdElement;
  };

  const render = (template) => {
    return Component.createElementFromString(...Array.from(template));
  };

  const _generateID = () => `${Math.random()}`.replace(/0./, '');

  const _generateEventListenerHandlers = (listeners) => {
    let arr = [];
    let id = _generateID();

    for (let type in listeners) {
      arr.push({
        type: 'listener',
        eventName: type.replace('on', '').toLowerCase(),
        query: `[data-tempid="${id}"]`,
        callback: listeners[type],
        attr: 'data-tempid',
        remove: false,
      });
    }

    arr[arr.length - 1].remove = true;

    return [arr, id];
  };

  const _generatePropHandlers = (props) => {
    let arr = [];
    let id = _generateID();

    for (let key in props) {
      arr.push({
        type: 'prop',
        propName: key,
        query: `[data-propid="${id}"]`,
        value: props[key],
        attr: 'data-propid',
        remove: false,
      });
    }

    arr[arr.length - 1].remove = true;

    return [arr, id];
  };

  const _generateTextHandler = (text) => {
    let id = _generateID();

    return {
      type: 'text',
      value: text,
      query: `[data-textid="${id}"]`,
      attr: 'data-textid',
      remove: true,
    };
  };

  const _createTemplate = (arr) => {
    let arrayLikeObj = {};

    for (let i in arr) {
      arrayLikeObj[i] = arr[i];
    }

    arrayLikeObj.length = arr.length;
    arrayLikeObj._type = 'template';

    Object.defineProperty(arrayLikeObj, '_type', {
      enumerable: false,
    });

    return arrayLikeObj;
  };

  const _parser = (expr, handlers) => {
    const isObject = (val) => typeof val === 'object';
    const isArray = (val) => Array.isArray(val);
    const isTemplateObject = (val) => isObject(val) && val.type;
    const isTemplate = (val) => val._type && val.type === 'template';
    const isEventListeners = (val) =>
      Object.keys(val).every((key) => key.includes('on'));

    // if expr is array, map and parse each item
    // items must be all strings after parsing
    if (isArray(expr)) {
      return expr.map((item) => _parser(item, handlers)).join('');

      // if template
      // add its handlers to ours
      // then return the string
    } else if (isTemplate(expr)) {
      handlers.push(...expr[1]);
      return expr[0];

      // if TemplateObject
      // so parse it with objectToString
    } else if (isTemplateObject(expr)) {
      return _parser(objectToString(expr), handlers);

      // if Object and that object contains only keys which name is an event
      // generate a temporary id and replace the object with it
      // then add the event listeners to our handlers
    } else if (isEventListeners(expr)) {
      let [eventHandlers, temporaryId] = _generateEventListenerHandlers(expr);
      handlers.push(...eventHandlers);

      return `data-tempid="${temporaryId}"`;
    }

    // if none of our accepted types, assume it is string
    // then just return it
    return expr;
  };

  const objectToString = (template) => {
    const {
      type,
      className,
      id,
      text,
      attr,
      prop,
      style,
      children,
      listeners,
    } = template;

    let handlers = [];

    let idStr = id ? ` id="${id}" ` : '';
    let classStr = className ? ` class="${className}"` : '';

    let styleStr = style
      ? ` style="${Object.keys(style)
          .map((type) => (style[type] ? `${type}: ${style[type]};` : ''))
          .join(' ')}"`
      : '';

    let attrStr = attr
      ? Object.keys(attr)
          .map((type) => (attr[type] ? `${type}="${attr[type]}"` : ''))
          .join(' ')
      : '';

    let childrenStr = Array.isArray(children)
      ? _parser(children, handlers)
      : '';

    let eventPlaceholder = '';
    if (listeners) {
      let [eventHandlers, id] = _generateEventListenerHandlers(listeners);
      handlers.push(...eventHandlers);
      eventPlaceholder = `data-tempid="${id}"`;
    }

    let textPlaceholder = '';
    if (text) {
      let [textHandler, id] = _generateTextHandler(text);
      handlers.push(textHandler);
      textPlaceholder = `data-textid="${id}"`;
    }

    let propPlaceholder = '';
    if (prop) {
      let [propHandlers, id] = _generatePropHandlers(prop);
      handlers.push(...propHandlers);
      propPlaceholder = `data-propid="${id}"`;
    }

    let htmlString = `<${type} ${textPlaceholder} ${propPlaceholder} ${eventPlaceholder} 
      ${idStr} ${classStr} ${attrStr} ${styleStr}>
      ${childrenStr}</${type}>`;

    return _createTemplate([htmlString, handlers]);
  };

  const parseString = (strings, ...exprs) => {
    let handlers = [];

    let evaluatedExprs = exprs.map((expr) => _parser(expr, handlers));

    let htmlString = evaluatedExprs.reduce(
      (fullString, expr, i) => (fullString += `${expr}${strings[i + 1]}`),
      strings[0]
    );

    return _createTemplate([htmlString, handlers]);
  };

  return {
    render,
    parseString,
    objectToString,
    createElementFromString,
  };
})();

export default Component;
