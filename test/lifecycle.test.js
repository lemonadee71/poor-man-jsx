import '@testing-library/jest-dom/extend-expect';
import { html, render } from '..';

describe('lifecycle methods', () => {
  // eslint-disable-next-line
  let cb1, cb2;
  const createDiv = (children, method, cb) =>
    html`<div ${{ [`@${method}`]: cb }}>${children}</div>`;

  beforeEach(() => {
    cb1 = jest.fn(function () {
      return this;
    });
    cb2 = jest.fn((node) => node);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('@create', () => {
    // eslint-disable-next-line
    let div1, div2;
    beforeEach(() => {
      div1 = createDiv('This is my div', 'create', cb1);
      div2 = createDiv(
        createDiv(createDiv('', 'create', cb1), 'create', cb1),
        'create',
        cb1
      );
    });

    it('runs on element creation', () => {
      render(div1);
      expect(cb1).toHaveBeenCalledTimes(1);
    });

    it('runs recursively', () => {
      render(div2);
      expect(cb1).toHaveBeenCalledTimes(3);
    });

    it('has reference to the element it was attached to', () => {
      const el = render(div1);

      expect(cb1).toHaveReturnedWith(el.firstChild);
    });

    it('node is passed to the callback', () => {
      const el = render(createDiv('', 'create', cb2));

      expect(cb2).toHaveReturnedWith(el.firstChild);
    });
  });

  describe('@destroy', () => {
    // eslint-disable-next-line
    let div1, div2;
    beforeEach(() => {
      div1 = createDiv('This is my div', 'destroy', cb1);
      div2 = createDiv(
        createDiv(createDiv('', 'destroy', cb1), 'destroy', cb1),
        'destroy',
        cb1
      );
    });

    it('runs when element is destroyed', (done) => {
      const el = render(div1, 'body');
      el.firstChild.remove();

      setTimeout(() => {
        try {
          expect(cb1).toHaveBeenCalledTimes(1);
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
          expect(cb1).not.toHaveBeenCalled();
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
          expect(cb1).toHaveBeenCalledTimes(3);
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
          expect(cb1).toHaveReturnedWith(child);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('node is passed to the callback', (done) => {
      const el = render(createDiv('', 'destroy', cb2), 'body');
      const child = el.firstChild;
      child.remove();

      setTimeout(() => {
        try {
          expect(cb2).toHaveReturnedWith(child);
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
      div1 = createDiv('This is my div', 'mount', cb1);
      div2 = createDiv(
        createDiv(createDiv('', 'mount', cb1), 'mount', cb1),
        'mount',
        cb1
      );
    });

    it('runs on mount', (done) => {
      render(div1, 'body');

      setTimeout(() => {
        try {
          expect(cb1).toHaveBeenCalledTimes(1);
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
          expect(cb1).toHaveBeenCalledTimes(2);
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
          expect(cb1).toHaveBeenCalledTimes(3);
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
          expect(cb1).toHaveReturnedWith(el.firstChild);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('node is passed to the callback', (done) => {
      const el = render(createDiv('', 'mount', cb2), 'body');

      setTimeout(() => {
        try {
          expect(cb2).toHaveReturnedWith(el.firstChild);
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
      div1 = createDiv('This is my div', 'unmount', cb1);
      div2 = createDiv(
        createDiv(createDiv('', 'unmount', cb1), 'unmount', cb1),
        'unmount',
        cb1
      );
    });

    it('runs when element is destroyed', (done) => {
      const el = render(div1, 'body');
      el.firstChild.remove();

      setTimeout(() => {
        try {
          expect(cb1).toHaveBeenCalledTimes(1);
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
          expect(cb1).toHaveBeenCalledTimes(1);
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
          expect(cb1).toHaveBeenCalledTimes(3);
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
          expect(cb1).toHaveReturnedWith(child);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('node is passed to the callback', (done) => {
      const el = render(createDiv('', 'unmount', cb2), 'body');
      const child = el.firstChild;
      child.remove();

      setTimeout(() => {
        try {
          expect(cb2).toHaveReturnedWith(child);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });
  });
});
