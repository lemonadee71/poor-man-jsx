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
