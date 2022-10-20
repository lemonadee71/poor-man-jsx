import '@testing-library/jest-dom/extend-expect';
import { fireEvent, screen } from '@testing-library/dom';
import {
  applyProps,
  createElementFromTemplate,
  createHook,
  html,
  processDirectives,
  render,
} from '../src';
import { getTarget as target, renderToBody, setup, teardown } from './utils';

beforeEach(setup);
afterEach(teardown);

describe('core', () => {
  const fn = jest.fn();

  it('escapes all strings passed', () => {
    const template = html`<div data-target>
      <p>Test</p>
      ${'<p>if this works</p>'}
    </div>`;
    document.body.append(createElementFromTemplate(template));

    expect(target().childElementCount).toBe(1);
    expect(target()).toHaveTextContent('Test <p>if this works</p>');
  });

  describe('accepts the following types inside the body:', () => {
    it('Template', () => {
      const div = html`<div></div>`;
      renderToBody(html`<main data-target>${div}</main>`);

      expect(target()).toContainHTML('<div></div>');
    });

    it('HTMLElement', () => {
      renderToBody(
        html`<div data-target>${document.createElement('div')}</div>`
      );

      expect(target()).toContainHTML('<div></div>');
    });

    it('Text node', () => {
      renderToBody(
        html`
          <div data-target>
            <span>Some </span>
            ${document.createTextNode('text')} and etc.
          </div>
        `
      );

      expect(target()).toHaveTextContent('Some text and etc.');
    });

    it('DocumentFragment', () => {
      const fragment = new DocumentFragment();
      fragment.append(document.createElement('div'));
      fragment.append(document.createElement('div'));

      renderToBody(html`<div data-target>${fragment}</div>`);

      expect(target()).toContainHTML('<div></div><div></div>');
    });

    it('array/s of acceptable values (Template, Node, HTMLElement, string)', () => {
      renderToBody(
        html`
          <ul data-target>
            ${new Array(3)
              .fill('test')
              .map((str, i) => html`<li>${str} ${i}</li>`)}
          </ul>
        `
      );

      expect(target().childElementCount).toBe(3);
    });
  });

  describe('accepts the following types inside the opening tag:', () => {
    it('object/s of props/directives', () => {
      const props1 = {
        class: 'my-class',
        onClick: fn,
      };
      const props2 = {
        innerHTML: '<p data-testid="child">Hello, World!</p>',
      };

      renderToBody(html`<div data-target ${props1} ${props2}></div>`);
      fireEvent.click(target());

      expect(fn).toBeCalled();
      expect(target()).toHaveClass('my-class');
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('array/s of string and/or objects', () => {
      const attrs = ['class="visible"', 'data-testid="multiple"'];
      const props = { children: html`<div data-testid="child"></div>` };

      renderToBody(html`<div ${[...attrs, props]}></div>`);

      expect(screen.getByTestId('multiple')).toHaveClass('visible');
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });
});

describe('functions', () => {
  describe('createElementFromTemplate', () => {
    it('creates a fragment', () => {
      const fragment = createElementFromTemplate(html`<div data-target></div>`);
      document.body.append(fragment);

      expect(target()).toBeInTheDocument();
    });
  });

  describe('render', () => {
    it('creates an element from Template', () => {
      const el = render(html`<div data-target>This is my div</div>`);
      document.body.append(el);

      expect(target()).toHaveTextContent('This is my div');
    });

    it('accepts a second parameter `element` as HTMLElement', () => {
      render(html`<div></div>`, document.body);

      expect(document.body).toContainHTML('<div></div>');
    });

    it('accepts a second parameter `element` as string', () => {
      render(html`<div></div>`, 'body');

      expect(document.body).toContainHTML('<div></div>');
    });

    it('throws an error if `element` is not an existing selector', () => {
      expect(() => render(html`<div></div>`, 'data-testid')).toThrowError();
    });

    it('throws an error if `element` is not a `Node`', () => {
      expect(() => render(html`<div></div>`, {})).toThrowError();
    });
  });

  describe('applyProps', () => {
    const fn = jest.fn();

    it('make changes based on object of attrs/directives', () => {
      const props = {
        'data-testid': 'target',
        class: 'my-class',
        onClick: fn,
        innerHTML: '<p data-testid="child">Hello, World!</p>',
      };
      const div = document.createElement('div');
      document.body.append(applyProps(div, props));

      fireEvent.click(target());

      expect(fn).toBeCalled();
      expect(target()).toHaveClass('my-class');
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('processDirectives', () => {
    it('process all directives from a given root node', () => {
      const state = createHook({ isVisible: true });
      const context = {
        'state.class': state.$isVisible,
        text: html`<p>Test</p>`,
      };

      document.body.innerHTML = `
      <div data-testid="process" class:[visible|hidden]="__state.class__">__text__</div>
    `;

      processDirectives(document.body, context);
      state.isVisible = false;

      expect(screen.getByTestId('process')).toHaveClass('hidden');
      expect(screen.getByTestId('process')).toHaveTextContent('Test');
      expect(screen.getByTestId('process').childElementCount).toBe(1);
    });
  });
});
