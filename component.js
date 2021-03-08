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
    let dataAttrName = 'data-tempid';
    let dataId = `${dataAttrName}="${id}"`;

    for (let type in listeners) {
      arr.push({
        type: 'listener',
        eventName: type.replace('on', '').toLowerCase(),
        query: `[${dataId}]`,
        callback: listeners[type],
        attr: dataAttrName,
        remove: false,
      });
    }

    arr[arr.length - 1].remove = true;

    return [arr, dataId];
  };

  const _generatePropHandlers = (props) => {
    let arr = [];
    let id = _generateID();
    let dataAttrName = 'data-propid';
    let dataId = `${dataAttrName}="${id}"`;

    for (let key in props) {
      arr.push({
        type: 'prop',
        propName: key.replace('$', ''),
        query: `[${dataId}]`,
        value: props[key],
        attr: dataAttrName,
        remove: false,
      });
    }

    arr[arr.length - 1].remove = true;

    return [arr, dataId];
  };

  const _generateTextHandler = (text) => {
    let id = _generateID();
    let dataAttrName = 'data-textid';
    let dataId = `${dataAttrName}="${id}"`;

    return [
      {
        type: 'text',
        value: text,
        query: `[${dataId}]`,
        attr: dataAttrName,
        remove: true,
      },
      dataId,
    ];
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
    const isTemplate = (val) => val._type && val._type === 'template';
    const isEventListeners = (val) =>
      Object.keys(val).every((key) => key.startsWith('on'));
    const isState = (val) =>
      Object.keys(val).every((key) => key.startsWith('$'));

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

      // if TemplateObject parse it with objectToString
    } else if (isTemplateObject(expr)) {
      return _parser(objectToString(expr), handlers);

      // if Object and that object contains only keys which name is an event
      // generate a temporary id and replace the object with it
      // then add the event listeners to our handlers
    } else if (isEventListeners(expr)) {
      let [eventHandlers, temporaryId] = _generateEventListenerHandlers(expr);
      handlers.push(...eventHandlers);

      return temporaryId;
    } else if (isState(expr)) {
      let [handlers, id] = bindState(expr);
      handlers.push(...handlers);

      return id;
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
      eventPlaceholder = id;
    }

    let textPlaceholder = '';
    if (text) {
      let [textHandler, id] = _generateTextHandler(text);
      handlers.push(textHandler);
      textPlaceholder = id;
    }

    let propPlaceholder = '';
    if (prop) {
      let [propHandlers, id] = _generatePropHandlers(prop);
      handlers.push(...propHandlers);
      propPlaceholder = id;
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

  const bindState = (state) => {
    let id = _generateID();
    let proxyId = `data-proxyid="${id}"`;
    let props = {};

    for (let prop in state) {
      let handler = state[prop];
      const bindedElements = dataStore.get(handler._id);
      const existingHandlers = bindedElements.get(id) || [];

      bindedElements.set(id, [
        ...existingHandlers,
        {
          targetProp: prop.replace('$', ''),
          propName: handler.propName,
          trap: handler.trap,
        },
      ]);

      props[prop.replace('$')] = handler.value;
    }

    let [propHandlers, propId] = _generatePropHandlers(props);

    return [propHandlers, `${proxyId} ${propId}`];
  };

  const createState = (initValue = null) => {
    const _id = _generateID();
    const isObject = (value) => typeof value === 'object';
    // Map contains id keys
    // id keys are proxy ids of elements binded to the state
    dataStore.set(_id, new Map());

    let state = {
      bind: (propName = 'value', trap = null) => {
        return {
          propName,
          trap,
          _id,
          value: propName === 'value' ? state.value : state.value[propName],
        };
      },
    };

    const setHandler = {
      set: (target, prop, value, receiver) => {
        let bindedElements = dataStore.get(_id);
        console.log(bindedElements);
        for (let [id, handlers] of bindedElements) {
          let el = document.querySelector(`[data-proxyid="${id}"]`);

          if (el) {
            handlers.forEach((handler) => {
              // handler.propName === 'value' for primitive states
              if (prop === handler.propName) {
                el[handler.targetProp] = handler.trap
                  ? handler.trap.call(null, value)
                  : value;
              }
            });
          } else {
            // delete handler when the target is unreachable (most likely deleted)
            bindedElements.delete(id);
          }
        }

        return Reflect.set(target, prop, value, receiver);
      },
    };

    if (isObject(initValue)) {
      state.value = new Proxy(initValue, setHandler);
    } else {
      state.value = initValue;
      state = new Proxy(state, setHandler);
    }

    return state;
  };

  // let example = {
  //   target: 'selector',
  //   propName: 'string',
  //   trap: 'function'
  // }

  return {
    render,
    parseString,
    objectToString,
    createElementFromString,
    createState,
  };
})();

export default Component;
