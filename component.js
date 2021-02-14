const Component = (() => {
  const dataStore = {};

  const _generateID = () => `${Math.random()}`.replace(/0./, '');

  const _createArrayLikeObject = (arr, type) => {
    let arrayLikeObj = {};

    for (let i in arr) {
      arrayLikeObj[i] = arr[i];
    }

    arrayLikeObj.length = arr.length;
    arrayLikeObj._type = type;

    Object.defineProperty(arrayLikeObj, '_type', {
      enumerable: false,
    });

    return arrayLikeObj;
  };

  const createElementFromObject = (template) => {
    let element, type, text;
    let id, className;

    const _checkForClass = (type) => {
      try {
        let _className = '';
        let _type = type;

        _className = type.match(/(\.\w+)/g);
        _className.forEach((cls) => {
          _type = _type.replace(cls, '');
        });
        className = _className.map((cls) => cls.replace('.', '')).join(' ');

        return _type;
      } catch (error) {
        className = template.className;

        return type;
      }
    };

    const _checkForId = (type) => {
      try {
        let _id = '';
        let _type = type;

        _id = _type.match(/#(\w+)/)[1];
        _type = _type.replace(`#${_id}`, '');
        id = _id;

        return _type;
      } catch (error) {
        id = template.id;

        return type;
      }
    };

    /*
      Special properties paragraph, span, link
      Example: 
        {
          paragraph: 'Text',
        } 
        or
        {
          type: 'p',
          text: 'Text',
        }
        creates <p>Text</p>
      */
    if (template.type) {
      type = template.type;
      type = _checkForClass(type);
      type = _checkForId(type);

      text = template.text || '';
    } else if (template.paragraph) {
      type = 'p';
      text = template.paragraph;
    } else if (template.span) {
      type = 'span';
      text = template.span;
    } else if (template.link) {
      type = 'a';
      text = template.link;
    }

    // Create element
    // Use fragment if template doesn't have a parent
    if (type === 'fragment') {
      element = document.createDocumentFragment();
    } else {
      element = document.createElement(type);
    }

    // Add classes
    if (className) {
      let classes = className.split(' ');
      element.classList.add(...classes);
    }

    // Add id
    if (id) {
      element.id = id;
    }

    // Add text
    if (text) {
      let textNode = document.createTextNode(text);
      element.appendChild(textNode);
    }

    // Add attributes
    if (template.attr) {
      let attributes = template.attr;
      for (let name in attributes) {
        let value = attributes[name];
        if (value) {
          element.setAttribute(name, value);
        }
      }
    }

    // Add style
    if (template.style) {
      let { style } = template;
      for (let property in style) {
        let value = style[property];
        if (value) {
          element.style[property] = value;
        }
      }
    }

    // Add properties
    if (template.prop) {
      for (let property in template.prop) {
        let value = template.prop[property];
        if (value) {
          element[property] = value;
        }
      }
    }

    // Add event listeners
    if (template.listeners) {
      let { listeners } = template;
      for (let type in listeners) {
        element.addEventListener(type, listeners[type]);
      }
    }

    // Add children
    if (template.children) {
      template.children.forEach((child) => {
        let el =
          typeof child === 'string'
            ? createElementFromString(child)
            : createElementFromObject(child);
        element.appendChild(el);
      });
    }

    return element;
  };

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

  const _generateEventListenerIds = (listeners) => {
    let arr = [];
    let temporaryId = _generateID();

    for (let type in listeners) {
      arr.push({
        type: 'listener',
        eventName: type.replace('on', '').toLowerCase(),
        query: `[data-tempid="${temporaryId}"]`,
        callback: listeners[type],
        attr: 'data-tempid',
        remove: false,
      });
    }

    arr[arr.length - 1].remove = true;

    return [arr, temporaryId];
  };

  const _parser = (expr, handlers) => {
    if (typeof expr === 'object') {
      // if expr is array, map and parse each item
      // items must be all strings after parsing
      if (Array.isArray(expr)) {
        return expr.map((item) => _parser(item, handlers)).join('');

        // if parsedString or parsedObject
        // add its handlers to ours
        // then return the string
      } else if (
        expr._type &&
        (expr._type === 'parsedString' || expr._type === 'parsedObject')
      ) {
        handlers.push(...expr[1]);
        return expr[0];

        // if Object and that object contains only keys which name is an event
        // generate a temporary id and replace the object with it
        // then add the event listeners to our handlers
      } else if (Object.keys(expr).every((key) => key.includes('on'))) {
        let temporaryPlaceholder = '';
        let [eventHandlers, temporaryId] = _generateEventListenerIds(expr);

        temporaryPlaceholder = `data-tempid="${temporaryId}"`;
        handlers.push(...eventHandlers);

        return temporaryPlaceholder;
      }

      // If the argument isn't one of the three object kinds above
      // We assume it's an object with a specific structure
      // so parse it with objectToString
      return _parser(objectToString(expr), handlers);

      // if string, just return it
    } else if (typeof expr === 'string') {
      return expr;

      // otherwise we have an error
      // we only accept objects and string
    } else {
      throw new TypeError('Invalid type');
    }
  };

  const objectToString = (template) => {
    let {
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
      let [eventHandlers, id] = _generateEventListenerIds(listeners);
      handlers.push(...eventHandlers);
      eventPlaceholder = `data-tempid="${id}"`;
    }

    let textPlaceholder = '';
    if (text) {
      let id = _generateID();
      handlers.push({
        type: 'text',
        value: text,
        query: `[data-textid="${id}"]`,
        attr: 'data-textid',
        remove: true,
      });

      textPlaceholder = `data-textid="${id}"`;
    }

    let propPlaceholder = '';
    if (prop) {
      let id = _generateID();
      for (let key in prop) {
        handlers.push({
          type: 'prop',
          propName: key,
          value: prop[key],
          query: `[data-propid="${id}"]`,
          attr: 'data-propid',
          remove: false,
        });
      }

      handlers[handlers.length - 1].remove = true;
      propPlaceholder = `data-propid="${id}"`;
    }

    let htmlString = `<${type} ${textPlaceholder} ${propPlaceholder} ${eventPlaceholder} 
      ${idStr} ${classStr} ${attrStr} ${styleStr}>
      ${childrenStr}</${type}>`;

    return _createArrayLikeObject([htmlString, handlers], 'parsedObject');
  };

  const parseString = (strings, ...exprs) => {
    let handlers = [];

    let evaluatedExprs = exprs.map((expr) => _parser(expr, handlers));

    let htmlString = evaluatedExprs.reduce(
      (fullString, expr, i) => (fullString += `${expr}${strings[i + 1]}`),
      strings[0]
    );

    return _createArrayLikeObject([htmlString, handlers], 'parsedString');
  };

  const render = (arrayLikeObj) => {
    return Component.createElementFromString(...Array.from(arrayLikeObj));
  };

  const bind = (data, targetEl) => {
    let { proxy, revoke } = Proxy.revocable(data.target, {
      set(target, prop, val, receiver) {
        // if the prop set is equal to the prop we are watching
        // update the element bound to its
        console.log(`Calling proxy for ${targetEl.target}`);
        if (prop === data.prop) {
          let targetElement = document.querySelector(targetEl.target);

          // check if the element bound to our data still exists
          if (targetElement) {
            let finalValue = data.func ? data.func.call(data.target, val) : val;

            targetElement[targetEl.prop] = targetEl.func
              ? targetEl.func.call(targetElement, finalValue)
              : finalValue;

            // if not, we assume that it's removed
            // then we revoke our proxy
            // then delete it from our store
          } else {
            console.log(`Revoking ${targetEl.target}`);
            // dataStore[targetEl.target].revoke();
            // delete dataStore[targetEl.target];
          }
        }

        return Reflect.set(target, prop, val, receiver);
      },
    });

    // data.target = proxy;
    // store the revoke associated with our proxy
    // so we can call it later
    dataStore[targetEl.target] = {};
    dataStore[targetEl.target].revoke = revoke;

    return proxy;
  };

  return {
    bind,
    render,
    parseString,
    objectToString,
    createElementFromObject,
    createElementFromString,
  };
})();

export default Component;
