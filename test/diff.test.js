import { screen } from '@testing-library/dom';
import { createHook, html, render } from '..';
import '@testing-library/jest-dom/extend-expect';

describe('diffing', () => {
  let list, hook, cb; //eslint-disable-line
  beforeEach(() => {
    cb = jest.fn(function () {
      return this;
    });
    [hook] = createHook({
      todos: [
        { id: 'eat', name: 'eat' },
        { id: 'shower', name: 'shower' },
        { id: 'sleep', name: 'sleep' },
      ],
    });
    list = html`
      <ul
        data-testid="list"
        x-list
        ${{
          $children: hook.$todos((items) =>
            items.map(
              (todo) =>
                html`<li key="${todo.id}" ${{ '@mount': cb }}>${todo.name}</li>`
            )
          ),
        }}
      ></ul>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shuffles the children', (done) => {
    render(list, 'body');
    hook.todos = [
      { id: 'sleep', name: 'sleep' },
      { id: 'eat', name: 'eat' },
      { id: 'shower', name: 'shower' },
    ];

    setTimeout(() => {
      try {
        expect(screen.getByTestId('list')).toContainHTML(
          '<li key="sleep">sleep</li>' +
            '<li key="eat">eat</li>' +
            '<li key="shower">shower</li>'
        );
        expect(cb).toHaveBeenCalledTimes(4);
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('updates edited children', () => {
    render(list, 'body');
    hook.todos = [
      { id: 'sleep', name: 'deep sleep' },
      { id: 'shower', name: 'shower' },
      { id: 'eat', name: 'eat bread' },
    ];

    expect(screen.getByTestId('list')).toContainHTML(
      '<li key="sleep">deep sleep</li>' +
        '<li key="shower">shower</li>' +
        '<li key="eat">eat bread</li>'
    );
  });

  it('adds new children', () => {
    render(list, 'body');
    hook.todos = [
      { id: 'exercise', name: 'exercise' },
      { id: 'sleep', name: 'sleep' },
      { id: 'eat', name: 'eat' },
      { id: 'read', name: 'read' },
      { id: 'shower', name: 'shower' },
    ];

    expect(screen.getByTestId('list')).toContainHTML(
      '<li key="exercise">exercise</li>' +
        '<li key="sleep">sleep</li>' +
        '<li key="eat">eat</li>' +
        '<li key="read">read</li>' +
        '<li key="shower">shower</li>'
    );
  });

  it('throws an error if child has no key', () => {
    render(list, 'body');

    expect(() => {
      hook.todos = [
        { id: 'exercise', name: 'exercise' },
        { id: 'sleep', name: 'sleep' },
        { id: '', name: 'eat' },
        { id: 'read', name: 'read' },
        { id: 'shower', name: 'shower' },
      ];
    }).toThrowError(
      'every children should have a key if parent is of type list'
    );
  });

  it('accepts other key string', (done) => {
    const [data] = createHook({
      todos: [
        { id: 'eat', name: 'eat' },
        { id: 'shower', name: 'shower' },
        { id: 'sleep', name: 'sleep' },
      ],
    });
    const newList = html`
      <ul
        data-testid="list"
        keystring="id"
        x-list
        ${{
          $children: data.$todos((items) =>
            items.map(
              (todo) =>
                html`<li id="${todo.id}" ${{ '@mount': cb }}>${todo.name}</li>`
            )
          ),
        }}
      ></ul>
    `;

    render(newList, 'body');
    data.todos = [
      { id: 'sleep', name: 'sleep' },
      { id: 'eat', name: 'eat' },
      { id: 'shower', name: 'shower' },
    ];

    setTimeout(() => {
      try {
        expect(screen.getByTestId('list')).toContainHTML(
          '<li id="sleep">sleep</li>' +
            '<li id="eat">eat</li>' +
            '<li id="shower">shower</li>'
        );
        expect(cb).toHaveBeenCalledTimes(4);
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });
});
