import '@testing-library/jest-dom/extend-expect';
import { html, render } from '..';

describe('lifecycle methods', () => {
  // eslint-disable-next-line
  let thisFunction, arrowFunction;
  const createDiv = (children, method, cb) =>
    html`<div ${{ [`on${method}`]: cb }}>${children}</div>`;

  beforeEach(() => {
    thisFunction = jest.fn(function () {
      return this;
    });
    arrowFunction = jest.fn((node) => node);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('@create', () => {
    // eslint-disable-next-line
    let div1, div2;
    beforeEach(() => {
      div1 = createDiv('This is my div', 'create', thisFunction);
      div2 = createDiv(
        createDiv(
          createDiv('', 'create', thisFunction),
          'create',
          thisFunction
        ),
        'create',
        thisFunction
      );
    });

    it('runs on element creation', () => {
      render(div1);
      expect(thisFunction).toHaveBeenCalledTimes(1);
    });

    it('runs recursively', () => {
      render(div2);
      expect(thisFunction).toHaveBeenCalledTimes(3);
    });

    it('runs only once', () => {
      const div = render(div1);
      div.dispatchEvent(new Event('@create'));
      div.dispatchEvent(new Event('@create'));

      expect(thisFunction).toHaveBeenCalledTimes(1);
    });

    it('has reference to the element it was attached to', () => {
      const el = render(div1);

      expect(thisFunction).toHaveReturnedWith(el.firstChild);
    });

    it('node is passed to the callback', () => {
      const el = render(createDiv('', 'create', arrowFunction));

      expect(arrowFunction.mock.results[0].value.target).toBe(el.firstChild);
    });
  });

  describe('@destroy', () => {
    // eslint-disable-next-line
    let div1, div2;
    beforeEach(() => {
      div1 = createDiv('This is my div', 'destroy', thisFunction);
      div2 = createDiv(
        createDiv(
          createDiv('', 'destroy', thisFunction),
          'destroy',
          thisFunction
        ),
        'destroy',
        thisFunction
      );
    });

    it('runs when element is destroyed', (done) => {
      const el = render(div1, 'body');
      el.firstChild.remove();

      setTimeout(() => {
        try {
          expect(thisFunction).toHaveBeenCalledTimes(1);
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
          expect(thisFunction).not.toHaveBeenCalled();
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
          expect(thisFunction).toHaveBeenCalledTimes(3);
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
          expect(thisFunction).toHaveReturnedWith(child);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('node is passed to the callback', (done) => {
      const el = render(createDiv('', 'destroy', arrowFunction), 'body');
      const child = el.firstChild;
      child.remove();

      setTimeout(() => {
        try {
          expect(arrowFunction.mock.results[0].value.target).toBe(child);
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
      div1 = createDiv('This is my div', 'mount', thisFunction);
      div2 = createDiv(
        createDiv(createDiv('', 'mount', thisFunction), 'mount', thisFunction),
        'mount',
        thisFunction
      );
    });

    it('runs on mount', (done) => {
      render(div1, 'body');

      setTimeout(() => {
        try {
          expect(thisFunction).toHaveBeenCalledTimes(1);
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
          expect(thisFunction).toHaveBeenCalledTimes(2);
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
          expect(thisFunction).toHaveBeenCalledTimes(3);
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
          expect(thisFunction).toHaveReturnedWith(el.firstChild);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('node is passed to the callback', (done) => {
      const el = render(createDiv('', 'mount', arrowFunction), 'body');

      setTimeout(() => {
        try {
          expect(arrowFunction.mock.results[0].value.target).toBe(
            el.firstChild
          );

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
      div1 = createDiv('This is my div', 'unmount', thisFunction);
      div2 = createDiv(
        createDiv(
          createDiv('', 'unmount', thisFunction),
          'unmount',
          thisFunction
        ),
        'unmount',
        thisFunction
      );
    });

    it('runs when element is destroyed', (done) => {
      const el = render(div1, 'body');
      el.firstChild.remove();

      setTimeout(() => {
        try {
          expect(thisFunction).toHaveBeenCalledTimes(1);
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
          expect(thisFunction).toHaveBeenCalledTimes(1);
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
          expect(thisFunction).toHaveBeenCalledTimes(3);
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
          expect(thisFunction).toHaveReturnedWith(child);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('node is passed to the callback', (done) => {
      const el = render(createDiv('', 'unmount', arrowFunction), 'body');
      const child = el.firstChild;
      child.remove();

      setTimeout(() => {
        try {
          expect(arrowFunction.mock.results[0].value.target).toBe(child);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });
  });

  it('allows multiple callbacks for single type', (done) => {
    const el = render(createDiv('', 'destroy', thisFunction), 'body');
    el.firstChild.addEventListener('@destroy', arrowFunction);
    el.firstChild.remove();

    setTimeout(() => {
      try {
        expect(thisFunction).toHaveBeenCalledTimes(1);
        expect(arrowFunction).toHaveBeenCalledTimes(1);
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });
});
