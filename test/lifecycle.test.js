import '@testing-library/jest-dom/extend-expect';
import { html, render } from '..';

describe('lifecycle methods', () => {
  let cb;
  const createDiv = (children, method) =>
    html`<div ${{ [`@${method}`]: cb }}>${children}</div>`;

  beforeEach(() => {
    cb = jest.fn(function () {
      return this;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('@create', () => {
    // eslint-disable-next-line
    let div1, div2;
    beforeEach(() => {
      div1 = createDiv('This is my div', 'create');
      div2 = createDiv(
        createDiv(createDiv('This is the innermost div', 'create'), 'create'),
        'create'
      );
    });

    it('runs on element creation', () => {
      render(div1);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('runs recursively', () => {
      render(div2);
      expect(cb).toHaveBeenCalledTimes(3);
    });

    it('has reference to the element it was attached to', () => {
      const el = render(div1);

      expect(cb).toHaveReturnedWith(el.firstChild);
    });
  });

  describe('@destroy', () => {
    // eslint-disable-next-line
    let div1, div2;
    beforeEach(() => {
      div1 = createDiv('This is my div', 'destroy');
      div2 = createDiv(
        createDiv(createDiv('This is the innermost div', 'destroy'), 'destroy'),
        'destroy'
      );
    });

    it('runs when element is destroyed', (done) => {
      const el = render(div1, 'body');
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

    it('does not run when node is moved', (done) => {
      const el = render(div1, 'body');
      const test = render(html`<div id="test"></div>`).firstChild;
      document.body.append(test);
      test.append(el.firstChild);

      setTimeout(() => {
        try {
          expect(cb).not.toHaveBeenCalled();
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('runs recursively', (done) => {
      const el = render(div2, 'body');
      const child = el.firstChild;
      child.remove();

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(3);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('has reference to element it was attached to', (done) => {
      const el = render(div1, 'body');
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

  describe('@mount', () => {
    // eslint-disable-next-line
    let div1, div2;
    beforeEach(() => {
      div1 = createDiv('This is my div', 'mount');
      div2 = createDiv(
        createDiv(createDiv('This is the innermost div', 'mount'), 'mount'),
        'mount'
      );
    });

    it('runs on mount', (done) => {
      render(div1, 'body');

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
      const el = render(div1, 'body').firstChild;
      const test = render(html`<div id="test"></div>`, 'body');
      setTimeout(() => {
        test.append(el);
      }, 0);

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(2);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('runs recursively', (done) => {
      render(div2, 'body');

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(3);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('has reference to element it was attached to', (done) => {
      const el = render(div1, 'body');

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
    // eslint-disable-next-line
    let div1, div2;
    beforeEach(() => {
      div1 = createDiv('This is my div', 'unmount');
      div2 = createDiv(
        createDiv(createDiv('This is the innermost div', 'unmount'), 'unmount'),
        'unmount'
      );
    });

    it('runs when element is destroyed', (done) => {
      const el = render(div1, 'body');
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
      const el = render(div1, 'body').firstChild;
      const test = render(html`<div id="test"></div>`).firstChild;
      document.body.append(test);
      test.append(el);

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('runs recursively', (done) => {
      const el = render(div2, 'body');
      el.firstChild.remove();

      setTimeout(() => {
        try {
          expect(cb).toHaveBeenCalledTimes(3);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('has reference to element it was attached to', (done) => {
      const el = render(div1, 'body');
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
