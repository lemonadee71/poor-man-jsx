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
      expect(cb).toHaveBeenCalledTimes(1);
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

    it('runs on mount', (done) => {
      render(div, 'body');

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('runs when node is moved', (done) => {
      const el = render(div, 'body');
      const test = render(html`<div id="test"></div>`).firstChild;
      document.body.append(test);
      test.append(el.firstChild);

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(2);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('has reference to element it was attached to', (done) => {
      const el = render(div, 'body');

      setTimeout(() => {
        try {
          expect(cb).toHaveReturnedWith(el.firstChild);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });
  });

  describe('@unmount', () => {
    let div;
    beforeEach(() => {
      div = html`<div ${{ '@unmount': cb }}>This is my div</div>`;
    });

    it('runs on unmount', (done) => {
      const el = render(div, 'body');
      el.firstChild.remove();

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('runs when node is moved', (done) => {
      const el = render(div, 'body');
      const test = render(html`<div id="test"></div>`).firstChild;
      document.body.append(test);
      test.append(el.firstChild);

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('has reference to element it was attached to', (done) => {
      const el = render(div, 'body');
      const child = el.firstChild;
      child.remove();

      setTimeout(() => {
        try {
          expect(cb).toHaveReturnedWith(child);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });
  });
});
