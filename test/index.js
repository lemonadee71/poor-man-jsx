import Component from '../component.js';

let obj = {
  name: '',
};

let state = Component.createState(obj);

const changeHandler = (e) => {
  state.value.name = e.currentTarget.value;
  console.log(state.value);
};

let { parseString: html } = Component;

document.body.prepend(
  Component.render(html`
    <p
      id="test1"
      ${{ $innerHTML: state.bind('name', (val) => `<strong>${val}</strong>`) }}
    >
      Hello
    </p>
    <p
      id="test4"
      ${{ $textContent: state.bind('name', (val) => `${Math.random()}`) }}
    >
      Howdy
    </p>
    <p id="test3" ${{ $textContent: state.bind('name') }}>Yo</p>
    <input
      id="test-input"
      type="text"
      placeholder="Text"
      ${{ onkeydown: changeHandler }}
    />
  `)
);

document.body.prepend(
  Component.render(html`
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
          html`<button
            ${{
              onClick: () => alert('Another alert'),
            }}
          >
            Another button
          </button>`,
        ],
      }}
    </div>
  `)
);

// document
//   .querySelector('.delete')
//   .addEventListener('click', (e) => e.target.parentElement.remove());

// obj = Component.bind(
//   {
//     target: obj,
//     prop: 'name',
//   },
//   {
//     target: '#test1',
//     prop: 'textContent',
//   }
// );

// obj = Component.bind(
//   {
//     target: obj,
//     prop: 'name',
//   },
//   {
//     target: '#test2',
//     prop: 'innerHTML',
//     func(val) {
//       return `<strong>Testing this ${val}</strong>`;
//     },
//   }
// );

// obj = Component.bind(
//   {
//     target: obj,
//     prop: 'name',
//     func(val) {
//       return `${Math.random()} + ${val}`;
//     },
//   },
//   {
//     target: '#test3',
//     prop: 'textContent',
//   }
// );

// create state
//
