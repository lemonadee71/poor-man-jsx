# Poor Man's JSX

Create html elements painlessly with tagged template literals.

## Usage

### Installation

```shell
npm i poor-man-jsx
```

Then import

```js
import { html, render, createState } from 'poor-man-jsx';
```

### Creating html elements

Attach event listeners like you are writing JSX

```js
const button = html`
  <button ${{ onClick: () => alert('Button clicked') }}>Click me!</button>
`;
document.body.append(render(button));
// And now you have a button that'll show an alert when clicked
```

You could do this too

```js
const props = {
  class: 'my-header',
  height: '30px',
  width: '100%',
  borderBottom: '1px solid black',
  display: 'flex',
  innerHTML: '<h1>Title</h1>',
};
const el = html`<header ${props}></header>`;
document.body.append(render(el));
```

If you don't want to render user injected html strings, just wrap it in `{% string here $}`

```js
const str = '<strong>This will render as a text node</strong>';
const p = html`<p>{% ${str} %}</p>`;
```

And you could pass arrays too

```js
const list = html`
  <ul>
    ${new Array(3).fill('test').map((str, i) => `<li>${str} ${i}</li>`)}
  </ul>
`;
document.body.append(render(list));
```

> Important: Props should be inside the opening tag

### State

component.js also provides a state-like functionality

To create one, just use `createState` which returns an array `[state, revoke]`. It accepts a primitive or an object. Since under the hood we're using `Proxy`, we convert a primitive to an object

```js
const [state1] = createState('test');
console.log(state1); // Proxy { value: 'test' }

const [state2, revoke] = createState({ num: 1 });
console.log(state2); // Proxy { num: 1 }

// and use revoke to revoke the Proxy and delete the state from memory
// this will also return the original unproxied object
revoke(); // returns { num: 1 }
```

> Under the hood, we're using `WeakMap` to store state so it's not really necessary to use revoke but use it when you can

Here's an example,

```js
const [count] = createState(0);
const el = html`
  <button ${{ onClick: () => count.value++ }}>Increment</button>
  <p id="test" ${{ $textContent: count.$value }}></p>
`;
document.body.append(render(el));

// Click the button two times
// p's textContent should be 2
console.log(document.getElementById('test').textContent); // 2
```

What this does is that every time we click the button, we increment count's `value`. What `$textContent: count.$value` is doing is that every time count's `value` changes, it will reflect the change in the element's `textContent`.

Note that we prefixed both `textContent` and `value` with `$`.

```js
// This will just set the element's textContent to count.value
// But won't change when value changes
textContent: count.value;

// And this will probably throw an error
$textContent: count.value;
textContent: count.$value;

// Do this
$textContent: count.$value;

// Or more generally
$prop: state.$key;
```
