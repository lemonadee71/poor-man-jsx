import '@testing-library/jest-dom/extend-expect';
import { createEvent, fireEvent, screen } from '@testing-library/dom';
import { apply, html, render } from '../src';

describe('core', () => {
  const mockCallback = jest.fn(() => true);

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('creates an element', () => {
    render(html`<div>Test</div>`, 'body');

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('escapes all strings passed', () => {
    render(
      html`<div data-testid="escaped">
        <p>Test</p>
        ${'<p>if this works</p>'}
      </div>`,
      'body'
    );

    expect(screen.getByTestId('escaped').children.length).toBe(1);
    expect(screen.getByTestId('escaped')).toHaveTextContent(
      'Test <p>if this works</p>'
    );
  });

  it('apply - make changes based on object', () => {
    const props = {
      'data-testid': 'apply',
      class: 'my-class',
      onClick: mockCallback,
      innerHTML: '<p data-testid="child">Hello, World!</p>',
    };
    const div = document.createElement('div');
    apply(div, props);
    document.body.append(div);

    fireEvent.click(screen.getByTestId('apply'));

    expect(mockCallback).toBeCalled();
    expect(screen.getByTestId('apply')).toHaveClass('my-class');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  describe('event listeners', () => {
    const anotherMock = jest.fn();
    const Button = (callback, options = '') => html`
      <button data-testid="btn" onClick${options}=${callback}>Click me!</button>
    `;

    it('can be attached with on[eventName] syntax', () => {
      render(Button(mockCallback), 'body');
      fireEvent.click(screen.getByTestId('btn'));

      expect(mockCallback).toBeCalledTimes(1);
    });

    it('can be attached with multiple callbacks', () => {
      render(Button([mockCallback, anotherMock]), 'body');
      fireEvent.click(screen.getByTestId('btn'));
      fireEvent.click(screen.getByTestId('btn'));

      expect(mockCallback).toBeCalledTimes(2);
      expect(anotherMock).toBeCalledTimes(2);
    });

    it('can be attached with option/s', () => {
      render(Button(mockCallback, '.once.prevent'), 'body');

      const myEvent = createEvent.click(screen.getByTestId('btn'));
      myEvent.preventDefault = jest.fn();

      fireEvent(screen.getByTestId('btn'), myEvent);
      fireEvent(screen.getByTestId('btn'), myEvent);

      expect(mockCallback).toBeCalledTimes(1);
      expect(myEvent.preventDefault).toBeCalledTimes(1);
    });

    it('can be attached with multiple callbacks with option/s', () => {
      render(Button([mockCallback, anotherMock], '.once'), 'body');
      fireEvent.click(screen.getByTestId('btn'));
      fireEvent.click(screen.getByTestId('btn'));

      expect(mockCallback).toBeCalledTimes(1);
      expect(anotherMock).toBeCalledTimes(1);
    });
  });

  describe('directives', () => {
    it(':text - sets the textContent', () => {
      render(html`<div :text="Test"></div>`, 'body');

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it(':html - sets the innerHTML', () => {
      const str = '<p data-testid="p">Test</p>';
      render(html`<div :html="${str}"></div>`, 'body');

      expect(screen.getByTestId('p')).toHaveTextContent('Test');
    });

    it(':children - accepts a node', () => {
      render(
        html`<div
          :children=${render(html`<p data-testid="p">Test</p>`)}
        ></div>`,
        'body'
      );

      expect(screen.getByTestId('p')).toHaveTextContent('Test');
    });

    it(':children - accepts an array of string, node, and Template', () => {
      const div = document.createElement('div');
      const children = [
        'This is ',
        html`<span data-testid="span">my component</span>`,
        div,
      ];

      render(
        html`<div data-testid="children" :children=${children}></div>`,
        'body'
      );

      expect(screen.getByTestId('children')).toContainElement(div);
      expect(screen.getByTestId('span')).toBeInTheDocument();
    });

    it('bool:attr - shows/hides an attribute depending on value', () => {
      render(
        html`<div data-testid="bool" bool:data-div="undefined">Test</div>`,
        'body'
      );

      expect(screen.getByTestId('bool')).not.toHaveAttribute('data-div');
    });

    it('bool:attr.preserve - make the attr value same as passed value', () => {
      render(
        html`<div data-testid="bool" bool:data-div.preserve="true">Test</div>`,
        'body'
      );

      expect(screen.getByTestId('bool')).toHaveAttribute('data-div', 'true');
    });

    it('bool:attr.mirror - make the attr value same as attr name', () => {
      render(
        html`<div data-testid="bool" readonly.mirror="test">Test</div>`,
        'body'
      );

      expect(screen.getByTestId('bool')).toHaveAttribute(
        'readonly',
        'readonly'
      );
    });

    it('bool:[attr,] - show/hide multiple attributes at once', () => {
      render(
        html`<div data-testid="bool" bool:[hidden,visible]="false">Test</div>`,
        'body'
      );

      expect(screen.getByTestId('bool')).not.toHaveAttribute('hidden');
      expect(screen.getByTestId('bool')).not.toHaveAttribute('visible');
    });

    it('class:name - toggles a className individually', () => {
      render(
        html`<div
          class:hidden="true"
          class:visible="false"
          data-testid="class:"
        >
          Test
        </div>`,
        'body'
      );

      expect(screen.getByTestId('class:')).toHaveClass('hidden');
      expect(screen.getByTestId('class:')).not.toHaveClass('visible');
    });

    it('class:[name,] - set multiple class names at once', () => {
      render(
        html`<div class:[hidden,visible]="true" data-testid="class:">
          Test
        </div>`,
        'body'
      );

      expect(screen.getByTestId('class:')).toHaveClass('hidden visible');
    });

    it('style:prop - sets a style property individually', () => {
      render(
        html`<div
          style:color="red"
          style:background-color="blue"
          data-testid="style:"
        >
          Test
        </div>`,
        'body'
      );

      expect(screen.getByTestId('style:')).toHaveStyle({
        color: 'red',
        'background-color': 'blue',
      });
    });

    it(':ref - stores a reference to the element', () => {
      const ref = {};
      render(html`<div :ref=${ref} data-testid="ref">Test</div>`, 'body');

      expect(screen.getByTestId('ref')).toEqual(ref.current);
    });

    it(':show - shows/hides element based on attribute value', () => {
      render(
        html`<div style="display: block" :show=${false} data-testid="show">
          Test
        </div>`,
        'body'
      );

      expect(screen.getByTestId('show')).toHaveStyle({ display: 'none' });
    });
  });

  describe('special attributes', () => {
    it('on - accepts an object of { eventName: fn | fn[] }', () => {
      const fns = {
        click: jest.fn(),
        keydown: jest.fn(),
      };

      render(html`<div data-testid="on" on=${fns}>Test</div>`, 'body');
      fireEvent.click(screen.getByTestId('on'));
      fireEvent.keyDown(screen.getByTestId('on'));

      expect(fns.click).toBeCalledTimes(1);
      expect(fns.keydown).toBeCalledTimes(1);
    });

    it('class - accepts an object (shortcut for multiple class:name)', () => {
      render(
        html`<div
          class=${{ hidden: true, visible: false }}
          data-testid="classObject"
        >
          Test
        </div>`,
        'body'
      );

      expect(screen.getByTestId('classObject')).toHaveClass('hidden');
      expect(screen.getByTestId('classObject')).not.toHaveClass('visible');
    });

    it('class - accepts an array of strings', () => {
      render(
        html`<div class=${['hidden', 'visible']} data-testid="classArray">
          Test
        </div>`,
        'body'
      );

      expect(screen.getByTestId('classArray')).toHaveClass('hidden visible');
    });

    it('style - accepts an object (shortcut for multiple style:prop)', () => {
      const style = {
        color: 'red',
        'background-color': 'blue',
      };

      render(
        html`<div style=${style} data-testid="styleObject">Test</div>`,
        'body'
      );

      expect(screen.getByTestId('styleObject')).toHaveStyle(style);
    });
  });

  describe('acceptable values', () => {
    describe('inside the body:', () => {
      it('Template', () => {
        const div = html`<div></div>`;
        render(html`<main data-testid="main">${div}</main>`, 'body');

        expect(screen.getByTestId('main')).toContainHTML('<div></div>');
      });

      it('HTMLElement', () => {
        render(
          html`<div data-testid="html">${document.createElement('div')}</div>`,
          'body'
        );

        expect(screen.getByTestId('html')).toContainHTML('<div></div>');
      });

      it('Text Node', () => {
        render(
          html`<div data-testid="text">
            <span>Some </span>
            ${document.createTextNode('text')} and etc.
          </div>`,
          'body'
        );

        expect(screen.getByTestId('text')).toHaveTextContent(
          'Some text and etc.'
        );
      });

      it('DocumentFragment', () => {
        const fragment = new DocumentFragment();
        fragment.append(document.createElement('div'));
        fragment.append(document.createElement('div'));

        render(html`<div data-testid="fragment">${fragment}</div>`, 'body');

        expect(screen.getByTestId('fragment')).toContainHTML(
          '<div></div><div></div>'
        );
      });

      it('arrays', () => {
        render(
          html`
            <ul data-testid="list">
              ${new Array(3)
                .fill('test')
                .map((str, i) => html`<li>${str} ${i}</li>`)}
            </ul>
          `,
          'body'
        );

        expect(screen.getByTestId('list').children.length).toBe(3);
      });
    });

    describe('inside opening tag:', () => {
      it('object/s', () => {
        const props1 = {
          'data-testid': 'attr-object',
          class: 'my-class',
          onClick: mockCallback,
        };
        const props2 = {
          innerHTML: '<p data-testid="child">Hello, World!</p>',
        };

        render(html`<div ${props1} ${props2}></div>`, 'body');
        fireEvent.click(screen.getByTestId('attr-object'));

        expect(mockCallback).toBeCalled();
        expect(screen.getByTestId('attr-object')).toHaveClass('my-class');
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });

      it('array/s of string and/or objects', () => {
        const attrs = ['class="visible"', 'data-testid="multiple"'];
        const props = { children: html`<div data-testid="child"></div>` };

        render(html`<div ${[...attrs, props]}></div>`, 'body');

        expect(screen.getByTestId('multiple')).toHaveClass('visible');
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
    });
  });
});
