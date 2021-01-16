const Component = (() => {
  const createElementFromObject = (template, reference = null) => {
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
        className = _className
          .map((cls) => cls.replace('.', ''))
          .join(' ');

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
    if (type === 'frag') {
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
        element.appendChild(
          createElementFromObject(child, reference)
        );
      });
    }

    // Store elements in the object passed to our function
    if (reference && template.name) {
      reference[template.name] = element;
    }

    return element;
  };

  const createElementFromString = (str, handlers = []) => {
    let createdElement = document
      .createRange()
      .createContextualFragment(str);

    handlers.forEach((handler) => {
      let el = createdElement.querySelector(handler.query);
      el.addEventListener(handler.type, handler.callback);

      if (handler.remove) {
        el.removeAttribute(handler.attr);
      }
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

    let styleStr = ` style="${Object.keys(style)
      .map((type) => `${type}: ${style[type]};`)
      .join(' ')}"`;

    let attrStr = Object.keys(attr)
      .map((type) => `${type}="${attr[type]}"`)
      .join(' ');

    let childrenStr = Array.isArray(children)
      ? children.map((child) => objectToString(child)).join('\n')
      : '';

    return `<${type}${idStr}${classStr}${attrStr}${styleStr}>
      ${text || ''}${childrenStr}
      </${type}>`;
  };

  const parseString = (strings, ...exprs) => {
    let eventHandlers = [];

    const _randNo = (seed) => Math.floor(Math.random() * seed);

    const _generateID = () =>
      `${_randNo(10)}${_randNo(10)}${_randNo(50)}`;

    const _parser = (expr) => {
      if (typeof expr === 'object') {
        if (Array.isArray(expr)) {
          return expr.map((item) => _parser(item)).join('');
        } else if (expr._type && expr._type === 'parsedString') {
          eventHandlers.push(...expr[1]);
          return expr[0];
        } else if (
          Object.keys(expr).every((prop) => prop.includes('on'))
        ) {
          let callbacks = expr;
          let temporaryPlaceholder = '';

          for (let type in callbacks) {
            let callbackId = `${type}${_generateID()}`;

            eventHandlers.push({
              type: type.replace('on', '').toLowerCase(),
              query: `[data-tempId="${callbackId}"]`,
              callback: callbacks[type],
              attr: 'data-tempId',
              remove: true,
            });

            temporaryPlaceholder += `data-tempId="${callbackId}"`;
          }

          return temporaryPlaceholder;
        }

        return objectToString(expr);
      }

      return expr;
    };

    let evaluatedExprs = exprs.map((expr) => _parser(expr));

    let parsedString = evaluatedExprs.reduce(
      (fullString, expr, i) =>
        (fullString += `${expr}${strings[i + 1]}`),
      strings[0]
    );

    let parsedObj = {
      0: parsedString,
      1: eventHandlers,
      _type: 'parsedString',
    };

    Object.defineProperty(parsedObj, '_type', {
      enumerable: false,
    });

    return parsedObj;
  };

  return {
    parseString,
    objectToString,
    createElementFromObject,
    createElementFromString,
  };
})();

export default Component;
