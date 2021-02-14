import Component from '../component.js';

let obj = {
  name: '',
};

let onChange = (e) => {
  obj.name = e.currentTarget.value;
};

document.body.prepend(
  Component.createElementFromString(`
  <p id="test1">Hello</p>
  <p id="test4">Howdy<span class="delete">X</span></p>
  <p id="test3">Yo</p>
  <input id="test-input" type="text" placeholder="Text"/>
`)
);

document.body.prepend(
  Component.render(Component.parseString`
    <div>
      ${{
        type: 'p',
        id: 'test2',
        text: '<h1>Testing this shit</h1>',
        children: [
          {
            type: 'button',
            text: 'alert me',
            listeners: {
              click: () => alert("It's working"),
            },
          },
          Component.parseString`<button ${{
            onClick: () => alert('Another alert'),
          }}>Another button</button>`,
        ],
      }}
    </div>
  `)
);

document.getElementById('test-input').addEventListener('keydown', onChange);
// document
//   .querySelector('.delete')
//   .addEventListener('click', (e) => e.target.parentElement.remove());

obj = Component.bind(
  {
    target: obj,
    prop: 'name',
  },
  {
    target: '#test1',
    prop: 'textContent',
  }
);

obj = Component.bind(
  {
    target: obj,
    prop: 'name',
  },
  {
    target: '#test2',
    prop: 'innerHTML',
    func(val) {
      return `<strong>Testing this ${val}</strong>`;
    },
  }
);

obj = Component.bind(
  {
    target: obj,
    prop: 'name',
    func(val) {
      return `${Math.random()} + ${val}`;
    },
  },
  {
    target: '#test3',
    prop: 'textContent',
  }
);
