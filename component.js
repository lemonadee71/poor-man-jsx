const Component = (() => {
  const createElement = (template, reference = null) => {
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
    }

    // Add id
    if (template.id) {
      element.id = template.id;
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
          Component.createElement(child, reference)
        );
      });
    }

    // Store elements in the object passed to our function
    if (reference && template.name) {
      reference[template.name] = element;
    }

    return element;
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
    } = template;

    const _parseStyle = (style) => {
      let styleString = '';
      for (let name in style) {
        let value = style[name];
        styleString += `${name}: ${value};`;
      }

      return styleString ? ` style="${styleString}"` : '';
    };

    const _parseAttr = (attr) => {
      let attrString = ' ';
      for (let name in attr) {
        let value = attr[name];
        attrString += `${name}="${value}" `;
      }

      return attrString;
    };

    return `<${type}${className ? ` class="${className}"` : ''}${
      id ? ` id="${id}"` : ''
    }${_parseAttr(attr)}${_parseStyle(style)}>\n${text || ''}\n${
      children && children.constructor === Array
        ? children
            .map((child) => Component.objectToString(child))
            .join('\n')
        : ''
    }</${type}>`;
  };

  const parseString = (strings, ...keys) => {
    let eventHandlers = [];

    const _randNo = (seed) => Math.floor(Math.random() * seed);

    const _parser = (value) => {
      if (typeof value === 'object') {
        if (value.constructor && value.constructor === Array) {
          return value.map((item) => _parser(item)).join('');
        } else if (value._type && value._type === 'parsedString') {
          eventHandlers.push(...value[1]);
          return value[0];
        } else if (
          Object.keys(value).every((prop) => prop.includes('on'))
        ) {
          let callbacks = value;
          let temporaryPlaceholder = '';

          for (let type in callbacks) {
            let callbackId = `${type}${_randNo(10)}${_randNo(
              10
            )}${_randNo(50)}`;

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

        return objectToString(value);
      }

      return value;
    };

    let parsedKeys = keys.map((key) => _parser(key));

    let parsedString = parsedKeys.reduce((fullString, current, i) => {
      return (fullString += `${current}${strings[i + 1]}`);
    }, strings[0]);

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

  const fromString = (str, handlers = []) => {
    let createdElement = document
      .createRange()
      .createContextualFragment(str);

    handlers.forEach((handler) => {
      let element = createdElement.querySelector(handler.query);
      element.addEventListener(handler.type, handler.callback);

      if (handler.remove) {
        element.removeAttribute(handler.attr);
      }
    });

    return createdElement;
  };

  // Bug here
  // Should check typeof template
  const render = (root, ...children) => {
    children.forEach((child) => {
      if (child.constructor === Array) {
        let createdElement = Component.fromString(...child);
        root.appendChild(createdElement);
      } else if (typeof child === 'string') {
        let createdElement = Component.fromString(child);
        root.appendChild(createdElement);
      } else if (typeof child === 'object') {
        let template = child.hasOwnProperty('render')
          ? child.render()
          : child;
        console.log(template);
        for (let element in template) {
          let createdElement = Component.createElement(
            template[element]
          );
          root.appendChild(createdElement);
        }
      }
    });
  };

  return {
    createElement,
    objectToString,
    parseString,
    fromString,
    render,
  };
})();
