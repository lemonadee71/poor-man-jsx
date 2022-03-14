import '@testing-library/jest-dom/extend-expect';
import { screen } from '@testing-library/dom';
import { html, render } from '..';

describe('render', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates an element from Template', () => {
    const el = render(html`<div data-testid="div">This is my div</div>`);
    document.body.append(el);

    expect(screen.getByTestId('div')).toHaveTextContent('This is my div');
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
