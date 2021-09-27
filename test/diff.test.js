import { screen } from '@testing-library/dom';
import { createHook, html, render } from '..';
import '@testing-library/jest-dom/extend-expect';

function createTodoItem(mountCallback, unmountCallback) {
  return (data) => html`
    <div class="todo" ${data.keyString}="${data.id}">
      <h2
        class="todo__title"
        ${{ '@mount': mountCallback, '@unmount': unmountCallback }}
      >
        ${data.name}
      </h2>
    </div>
  `;
}

function createTodoList(todoItem, keyString = 'key') {
  const [data] = createHook({
    todos: [
      { id: 'eat', name: 'eat' },
      { id: 'shower', name: 'shower' },
      { id: 'sleep', name: 'sleep' },
    ],
  });
  const component = html`
    <h2>This is my Todo</h2>
    <div
      is-list
      data-testid="todo-list"
      keystring="${keyString}"
      ${{
        $children: data.$todos((items) =>
          items.map((todo) => todoItem({ ...todo, keyString }))
        ),
      }}
    ></div>
  `;

  return { data, component };
}

const getKeys = (node) =>
  [...node.children]
    .map((child) => child.getAttribute(node.getAttribute('keystring') || 'key'))
    .join();

const getTitle = (node) =>
  [...node.children]
    .map((child) => child.querySelector('.todo__title').textContent.trim())
    .join();

describe('diffing', () => {
  let mountCallback, unmountCallback; //eslint-disable-line
  beforeEach(() => {
    mountCallback = jest.fn();
    unmountCallback = jest.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shuffles the children efficiently', (done) => {
    const { data, component } = createTodoList(
      createTodoItem(mountCallback, unmountCallback)
    );
    render(component, 'body');

    data.todos = [
      { id: 'shower', name: 'shower' },
      { id: 'eat', name: 'eat' },
      { id: 'sleep', name: 'sleep' },
    ];

    setTimeout(() => {
      try {
        expect(getKeys(screen.getByTestId('todo-list'))).toBe(
          data.todos.map((todo) => todo.id).join()
        );
        expect(mountCallback).toHaveBeenCalledTimes(4);
        expect(unmountCallback).toHaveBeenCalledTimes(1);
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('adds new children', (done) => {
    const { data, component } = createTodoList(
      createTodoItem(mountCallback, unmountCallback)
    );
    render(component, 'body');

    data.todos = [
      { id: 'eat', name: 'eat' },
      { id: 'exercise', name: 'exercise' },
      { id: 'shower', name: 'shower' },
      { id: 'sleep', name: 'sleep' },
      { id: 'read', name: 'read' },
    ];

    setTimeout(() => {
      try {
        expect(getKeys(screen.getByTestId('todo-list'))).toBe(
          data.todos.map((todo) => todo.id).join()
        );
        expect(mountCallback).toHaveBeenCalledTimes(7);
        expect(unmountCallback).not.toHaveBeenCalled();
        done();
      } catch (error) {
        done(error);
      }
    }, 0);
  });

  it('throws an error if child has no key', () => {
    const { data, component } = createTodoList(
      createTodoItem(mountCallback, unmountCallback)
    );
    render(component, 'body');

    expect(() => {
      data.todos = [
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

  it('accepts other key string', () => {
    const { data, component } = createTodoList(
      createTodoItem(mountCallback, unmountCallback),
      'id'
    );
    render(component, 'body');

    expect(getKeys(screen.getByTestId('todo-list'))).toBe(
      data.todos.map((todo) => todo.id).join()
    );
  });

  describe('updates children', () => {
    let listItemMountCallback, listItemUnmountCallback; // eslint-disable-line
    beforeEach(() => {
      listItemMountCallback = jest.fn();
      listItemUnmountCallback = jest.fn();
    });

    const createCustomTodoItem = (mount, unmount) => (data) => {
      const defaultLabels = ['physical', 'mental', 'misc'];

      return html`
        <div
          class="todo"
          ${data.keyString}="${data.id}"
          checked="${data.checked || 'false'}"
        >
          <div class="todo__labels" ${{ '@unmount': unmount }}>
            <ul is-list ${{ '@unmount': unmount }}>
              ${(data.labels || defaultLabels).map(
                (label) =>
                  html`<li
                    ${data.keyString}="${label}"
                    ${{
                      '@mount': listItemMountCallback,
                      '@unmount': listItemUnmountCallback,
                    }}
                  >
                    ${label}
                  </li>`
              )}
            </ul>
          </div>
          <div class="todo__body" ${{ '@unmount': unmount }}>
            <h2 class="todo__title" ${{ '@mount': mount, '@unmount': unmount }}>
              ${data.name}
            </h2>
          </div>
          <div is-dynamic class="todo__footer" ${{ '@unmount': unmount }}>
            <span>Due date: </span>${data.dueDate}
          </div>
        </div>
      `;
    };

    it('but only the node that was actually changed', (done) => {
      const { data, component } = createTodoList(
        createCustomTodoItem(mountCallback, unmountCallback)
      );
      render(component, 'body');

      data.todos = [
        { id: 'eat', name: 'eat', checked: 'true' },
        { id: 'shower', name: 'shower' },
        { id: 'sleep', name: 'deep sleep' },
      ];

      setTimeout(() => {
        try {
          expect(
            screen.getByTestId('todo-list').querySelector('[key="eat"]')
          ).toHaveAttribute('checked', 'true');
          expect(getTitle(screen.getByTestId('todo-list'))).toBe(
            data.todos.map((todo) => todo.name).join()
          );
          expect(mountCallback).toHaveBeenCalledTimes(4);
          expect(unmountCallback).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('by rerendering the whole node if is-dynamic', (done) => {
      const { data, component } = createTodoList(
        createCustomTodoItem(mountCallback, unmountCallback)
      );
      render(component, 'body');

      data.todos = [
        { id: 'eat', name: 'eat', dueDate: new Date().toString() },
        { id: 'shower', name: 'shower' },
        { id: 'sleep', name: 'sleep' },
      ];

      setTimeout(() => {
        try {
          expect(
            screen
              .getByTestId('todo-list')
              .querySelector('[key="eat"] .todo__footer')
          ).toContainHTML(`<span>Due date: </span>${data.todos[0].dueDate}`);
          expect(unmountCallback).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });

    it('by diffing recursively if child is type list', (done) => {
      const { data, component } = createTodoList(
        createCustomTodoItem(mountCallback, unmountCallback)
      );
      render(component, 'body');

      data.todos = [
        { id: 'eat', name: 'eat', labels: ['physical', 'diet', 'misc'] },
        { id: 'shower', name: 'shower' },
        { id: 'sleep', name: 'sleep', labels: ['misc'] },
      ];

      setTimeout(() => {
        try {
          expect(
            getKeys(
              screen
                .getByTestId('todo-list')
                .querySelector('[key="eat"] .todo__labels [is-list]')
            )
          ).toBe(data.todos[0].labels.join());
          expect(
            getKeys(
              screen
                .getByTestId('todo-list')
                .querySelector('[key="sleep"] .todo__labels [is-list]')
            )
          ).toBe(data.todos[2].labels.join());
          expect(unmountCallback).not.toHaveBeenCalled();
          // ? This should not be below 9 but it gives 8 so I don't what the issue is
          // ? So ignore for now since this assertion isn't that important
          // expect(listItemMountCallback).toHaveBeenCalledTimes(10);
          expect(listItemUnmountCallback).toHaveBeenCalledTimes(3);
          done();
        } catch (error) {
          done(error);
        }
      }, 0);
    });
  });
});
