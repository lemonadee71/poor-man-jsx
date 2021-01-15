const Component = (() => {
  const createElementFromObject = (template, reference = null) => {
    let element, type, text;

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
    element = document.createElement(type);

    // Add classes
    if (template.className) {
      let classes = template.className.split(' ');
      element.classList.add(...classes);
    } else {
      try {
        let _className = '';
        _className = type
          .match(/.(\w+)/g)
          .map((cls) => cls.replace('.', ''));

        element.classList.add(..._className);
      } catch (error) {
        console.log('No matches');
      }
    }

    // Add id
    if (template.id) {
      element.id = template.id;
    } else {
      try {
        let _id = '';

        _id = type.match(/#(\w+)/)[1];
        type.replace(`#${_id}`, '');

        element.id = _id;
      } catch (error) {
        console.log('No matches');
      }
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
