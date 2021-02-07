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

  const createElementFromString = (str, handlers = [], children = []) => {
    let createdElement = document.createRange().createContextualFragment(str);

    handlers.forEach((handler) => {
      let el = createdElement.querySelector(handler.query);
      el.addEventListener(handler.type, handler.callback);

      if (handler.remove) {
        el.removeAttribute(handler.attr);
      }
    });

    children.forEach((child) => {
      let placeholder = createdElement.querySelector(child.query);
      let parent = placeholder.parentElement;

      parent.appendChild(child.element);
      placeholder.remove();
    });

    return createdElement;
  };

  const objectToString = (template) => {
    let {
      type,
      className,
      id,
      text,
      attr,
      style,
      children,
      listeners,
    } = template;

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
      ? children.map((child) => objectToString(child)).join('\n')
      : '';

    return `<${type} ${idStr} ${classStr} ${attrStr} ${styleStr}>
      ${text || ''}${childrenStr}
      </${type}>`;
  };

  const parseString = (strings, ...exprs) => {
    let eventHandlers = [];
    let children = [];

    const _parser = (expr) => {
      if (expr instanceof HTMLElement) {
        let temporaryId = _generateID();

        children.push({
          element: expr,
          query: `div[data-tempid="${temporaryId}"]`,
        });

        return `<div data-tempid="${temporaryId}"></div>`;
      } else if (typeof expr === 'object') {
        // if expr is array, map and parse each item
        // items must be all strings after parsing
        if (Array.isArray(expr)) {
          return expr.map((item) => _parser(item)).join('');

          // if parsedString (the Array-like object returned by parseString)
          // add its eventHandlers to ours
          // then return the string
        } else if (expr._type && expr._type === 'parsedString') {
          eventHandlers.push(...expr[1]);
          children.push(...expr[2]);
          return expr[0];

          // if Object and that object contains only keys which name is an event
          // generate a temporary id and replace the object with it
          // then add the event listeners to our eventHandlers
        } else if (Object.keys(expr).every((key) => key.includes('on'))) {
          let callbacks = expr;
          let temporaryPlaceholder = '';
          let temporaryId = _generateID();

          for (let type in callbacks) {
            eventHandlers.push({
              type: type.replace('on', '').toLowerCase(),
              query: `[data-tempid="${temporaryId}"]`,
              callback: callbacks[type],
              attr: 'data-tempid',
              remove: false,
            });
          }

          temporaryPlaceholder = `data-tempid="${temporaryId}"`;
          // This is to allow for multiple event handlers for one element
          eventHandlers[eventHandlers.length - 1].remove = true;

          return temporaryPlaceholder;
        }

        // If the argument isn't one of the three object kinds above
        // We assume it's an object with a specific structure
        // so parse it with objectToString
        return objectToString(expr);

        // if string, just return it
      } else if (typeof expr === 'string') {
        return expr;

        // otherwise we have an error
        // we only accept objects and string
      } else {
        throw new TypeError('Invalid type');
      }
    };

    let evaluatedExprs = exprs.map((expr) => _parser(expr));

    let parsedString = evaluatedExprs.reduce(
      (fullString, expr, i) => (fullString += `${expr}${strings[i + 1]}`),
      strings[0]
    );

    return _createArrayLikeObject(
      [parsedString, eventHandlers, children],
      'parsedString'
    );
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
            console.log(`Revoking this shit ${targetEl.target}`);
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
