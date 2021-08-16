import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom/extend-expect';
import { html, render } from '..';

describe('lifecycle methods', () => {
  let cb;
  beforeEach(() => {
    cb = jest.fn(function () {
      return this;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('@create', () => {
    let div;
    beforeEach(() => {
      div = html`<div ${{ '@create': cb }}>This is my div</div>`;
    });

    it('runs on element creation', () => {
      render(div);
      expect(cb).toHaveBeenCalled();
    });

    it('has reference to the element it was attached to', () => {
      const el = render(div);

      expect(cb).toHaveReturnedWith(el.firstChild);
    });
  });

  describe('@mount', () => {
    let div;
    beforeEach(() => {
      div = html`<div ${{ '@mount': cb }}>This is my div</div>`;
    });

    it('runs on mount', () => {
      render(div, 'body');

      expect(cb).toHaveBeenCalled();
    });

    it("doesn't run if element was appended manually", () => {
      const el = render(div);
      document.body.append(el);

      expect(cb).not.toHaveBeenCalled();
    });

    it('has reference to element it was attached to', () => {
      const el = render(div, 'body');

      expect(cb).toHaveReturnedWith(el.firstChild);
    });
  });
});
