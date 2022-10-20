import '@testing-library/jest-dom/extend-expect';
import { createEvent, fireEvent, screen } from '@testing-library/dom';
import { applyProps, html } from '../src';
import {
  getTarget as target,
  renderToBody as render,
  setup,
  teardown,
} from './utils';

const fn = jest.fn(() => true);

beforeEach(setup);
afterEach(teardown);

describe('on', () => {
  const anotherFn = jest.fn();
  const Button = (callback, options = []) => {
    const optionString = options.length ? `.${options.join('.')}` : '';

    return html`
      <button data-target onClick${optionString}=${callback}>Click me!</button>
    `;
  };

  it('accepts an object of { event: fn | fn[] }', () => {
    const fns = { click: fn, keydown: anotherFn };

    render(html`<div data-target on=${fns}></div>`);
    fireEvent.click(target());
    fireEvent.keyDown(target());

    expect(fn).toBeCalledTimes(1);
    expect(anotherFn).toBeCalledTimes(1);
  });

  it('on[event] - adds event listener of type `event`', () => {
    render(Button(fn));
    fireEvent.click(target());

    expect(fn).toBeCalledTimes(1);
  });

  it('on[event] - allows multiple listeners to be attached to `event`', () => {
    render(Button([fn, anotherFn]));
    fireEvent.click(target());
    fireEvent.click(target());

    expect(fn).toBeCalledTimes(2);
    expect(anotherFn).toBeCalledTimes(2);
  });

  it('on[event] is case insensitive', () => {
    render(html`<button data-target oncLiCK=${fn}>Click me!</button>`);
    fireEvent.click(target());

    expect(fn).toBeCalledTimes(1);
  });

  it('on[event].option - allows listeners to be attached with option/s', () => {
    render(Button(fn, ['once', 'prevent']));

    const myEvent = createEvent.click(target());
    myEvent.preventDefault = jest.fn();

    fireEvent(target(), myEvent);
    fireEvent(target(), myEvent);

    expect(fn).toBeCalledTimes(1);
    expect(myEvent.preventDefault).toBeCalledTimes(1);
  });

  it('on[event].option - allows multiple listeners to be attached with option/s', () => {
    render(Button([fn, anotherFn], ['once']));
    fireEvent.click(target());
    fireEvent.click(target());

    expect(fn).toBeCalledTimes(1);
    expect(anotherFn).toBeCalledTimes(1);
  });
});

describe('class', () => {
  it('accepts an object of { className: boolean } (shortcut for multiple class:name)', () => {
    render(
      html`<div data-target class=${{ hidden: true, visible: false }}>
        Test
      </div>`
    );

    expect(target()).toHaveClass('hidden');
    expect(target()).not.toHaveClass('visible');
  });

  it('acceps an array of acceptable values (string, object)', () => {
    render(
      html`<div data-target class=${['flex flex-col', { visible: true }]}>
        Test
      </div>`
    );

    expect(target()).toHaveClass('flex flex-col visible');
  });

  it('class:name - toggles a single className', () => {
    render(
      html`<div class:hidden="true" class:visible="false" data-target>
        Test
      </div>`
    );

    expect(target()).toHaveClass('hidden');
    expect(target()).not.toHaveClass('visible');
  });

  it('class:[name,] - toggles multiple class names at once', () => {
    render(html`<div class:[flex,flex-col]="true" data-target>Test</div>`);

    expect(target()).toHaveClass('flex flex-col');
  });

  it('class:[name1,|name2,] - switches between class/es', () => {
    render(html`<div class:[hidden|visible]="true" data-target>Test</div>`);

    const element = target();
    const firstState = element.cloneNode();
    applyProps(element, { 'class:[hidden|visible]': false });

    expect(firstState).toHaveClass('hidden');
    expect(target()).toHaveClass('visible');
  });
});

describe('style', () => {
  it('accepts an object (shortcut for multiple style:prop)', () => {
    const style = {
      color: 'red',
      'background-color': 'blue',
    };

    render(html`<div style=${style} data-target>Test</div>`);

    expect(target()).toHaveStyle(style);
  });

  it('accepts an object that have camelCase keys instead of kebab-case', () => {
    const style = {
      color: 'red',
      fontSize: '14px',
      backgroundColor: 'blue',
    };

    render(html`<div style=${style} data-target>Test</div>`);

    expect(target()).toHaveStyle(style);
  });

  it('style:prop - sets a style property individually', () => {
    render(
      html`<div
        data-target
        style:color="red"
        style:background-color="blue"
      ></div>`
    );

    expect(target()).toHaveStyle({
      color: 'red',
      'background-color': 'blue',
    });
  });
});

describe('toggle', () => {
  it('toggle:attr - shows/hides an attribute depending on value', () => {
    render(html`<div data-target toggle:data-visible="undefined">Test</div>`);

    expect(target()).not.toHaveAttribute('data-visible');
  });

  it('toggle:attr.preserve - make the attr value same as passed value', () => {
    render(
      html`<div data-target toggle:data-visible.preserve="true">Test</div>`
    );

    expect(target()).toHaveAttribute('data-visible', 'true');
  });

  it('toggle:attr.mirror - make the attr value same as attr name', () => {
    render(html`<div data-target readonly.mirror="test">Test</div>`);

    expect(target()).toHaveAttribute('readonly', 'readonly');
  });

  it('toggle:[attr,] - show/hide multiple attributes at once', () => {
    render(
      html`<div data-target toggle:[data-selected,data-drag]="false">Test</div>`
    );

    expect(target()).not.toHaveAttribute('data-selected');
    expect(target()).not.toHaveAttribute('data-drag');
  });
});

describe(':children', () => {
  it('accepts a string', () => {
    render(html`<div data-target :children=${'Test'}></div>`);

    expect(target()).toHaveTextContent('Test');
  });

  it('accepts a Node', () => {
    render(
      html`<div data-target :children=${document.createTextNode('Test')}></div>`
    );

    expect(target()).toHaveTextContent('Test');
  });

  it('accepts a Template', () => {
    render(html`<div :children=${html`<p data-target>Test</p>`}></div>`);

    expect(target()).toHaveTextContent('Test');
  });

  it('accepts an array of string, Node, and Template', () => {
    const div = document.createElement('div');
    const children = [
      'This is ',
      html`<span data-testid="span">my component</span>`,
      div,
    ];

    render(html`<div data-target :children=${children}></div>`);

    expect(target()).toContainElement(div);
    expect(screen.getByTestId('span')).toBeInTheDocument();
  });

  it('filters out null, undefined, and boolean values', () => {
    render(
      html`<div data-target :children=${[true, false, null, undefined]}></div>`
    );

    expect(target()).toHaveTextContent('');
  });

  // Diffing here throws an error which is due to the p element having no key
  // Having existing elements should be avoided when using children
  it('overrides existing children of the element', () => {
    render(
      html`<div data-target :children=${['This is a new paragraph']}>
        <p>This is a paragraph</p>
      </div>`
    );

    expect(target().childElementCount).toBe(0);
    expect(target()).toHaveTextContent('This is a new paragraph');
  });
});

describe(':text', () => {
  it('sets the textContent of the element', () => {
    render(html`<div :text="Test"></div>`);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

describe(':html', () => {
  it('sets the innerHTML of the element', () => {
    const str = '<p data-testid="p">Test</p>';
    render(html`<div :html="${str}"></div>`);

    expect(screen.getByTestId('p')).toHaveTextContent('Test');
  });
});

describe(':ref', () => {
  it('stores a reference to the element', () => {
    const ref = {};
    render(html`<div :ref=${ref} data-target>Test</div>`);

    expect(target()).toEqual(ref.current);
  });

  it('can use a custom key instead of `current`', () => {
    const ref = {};
    render(html`<div :ref=${['self', ref]} data-target>Test</div>`);

    expect(target()).toEqual(ref.self);
  });
});

describe(':show', () => {
  it('shows/hides element based on attribute value by changing display', () => {
    render(html`<div style="display: block" :show=${false} data-target></div>`);

    expect(target()).toHaveStyle({ display: 'none' });
  });
});

describe(':visible', () => {
  it("toggles element's visibility based on attribute value", () => {
    render(html`<div :visible=${false} data-target></div>`);

    expect(target()).toHaveStyle({
      visibility: 'hidden',
    });
  });
});
