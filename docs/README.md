# Poor Man's JSX

Create DOM elements painlessly with tagged template literals.

## Installation

```shell
npm i poor-man-jsx
```

Then import

```js
import { html, render } from 'poor-man-jsx';
```

## Usage

### Creating elements

To create elements, there are only two functions you need: `html` and `render`.

Use the `html` function to prefix your template literals (use it as a **tag**). This will allow you to write your elements in a jsx-like way.

```js
// you can attach event listeners like you would in React
const button = html`<button onClick=${callback}>Click me!</button>`;
```

Then use `render` to create an element from the `Template` returned by `html`. `render` creates a `DocumentFragment` which you can then append to the DOM.

```js
const element = render(button);
document.body.append(element);
```

We can also just pass an optional second argument to `render` to append the created element to the DOM. It accepts either a selector string or an `HTMLElement`.

```js
// Let's append the button we created before to the body
render(button, document.body);
// which can also be written as
render(button, 'body');
```

> If passed a second argument, it will return passed element or the matching element

### Writing your components

Aside from the usual way of writing attributes like in the examples above, you can also add attributes (class, id, etc.), properties (textContent, innerHTML) and event listeners by passing an object.

```js
const props = {
  class: 'my-header',
  innerHTML: '<h1>Title</h1>',
  style: 'height: 30px; width: 100%;',
  onClick: () => alert('Header clicked!'),
};
const header = html`<header ${props}></header>`;

render(header, document.body);
```

Will result in

```html
<header style="height: 30px; width: 100%;" class="my-header">
  <h1>Title</h1>
</header>
```

> The object should be within the opening tag of the element

When using an object, you can set style attributes individually by prefixing the names with `style_`. So this

```js
const style = {
  style_height: '30px',
  style_width: '100%',
  display: 'flex',
  innerHTML: '<h1>Title</h1>',
};
const header = html`<header ${style}></header>`;

render(header, document.body);
```

will result in

```html
<header style="height: 30px; width: 100%;" display="flex">
  <h1>Title</h1>
</header>
```

> Use camelCase for CSS properties

You can also pass arrays. The array should only contain `string`, `Template`, or `Node` (`HTMLElement`, `DocumentFragment`, or `Text`)

```js
const list = html`
  <ul>
    ${new Array(3).fill('test').map((str, i) => `<li>${str} ${i + 1}</li>`)}
  </ul>
`;
```

You could also pass in a `Template` (and any of the types mentioned above) which was returned by `html`. This allows for better composition of components.

```js
// add the list we created above to our nav
const nav = html`<nav>${list}</nav>`;
render(nav, 'body');
```

> Note: `Template` and `Node` (`HTMLElement`, `DocumentFragment`, or `Text`) can only be passed inside the body of an element. Other things can be passed inside the opening tag of an element like functions for event listeners (see examples above).

Also unlike React, your elements doesn't need to be wrapped by a parent element. The above example can be written as

```js
// list items don't need a wrapping element
const items = html`
  <li>Test 1</li>
  <li>Test 2</li>
  <li>Test 3</li>
`;
const nav = html`
  <nav>
    <ul>
      ${items}
    </ul>
  </nav>
`;

render(nav, 'body');
```

#### Avoiding rendering user injected strings

By default, any string you passed in will be rendered as element (almost the same behavior as `innerHTML`). If you don't want to render user injected html strings, just wrap it in `{% string here $}`. Now this behaves more like `textContent`.

```js
const str = '<strong>This will render as a text</strong>';
const p = html`<p id="test">{% ${str} %}</p>`;

render(p, 'body');
console.log(document.getElementById('test').textContent); // <strong>This will render as a text</strong>
```

or you could just pass a text node to achieve the same result

```js
const p = html`<p id="test">${document.createTextNode(str)}</p>`;
```

#### Event listener options

You can also specify event listener options when writing your elements. At the moment you can use `prevent`, `once`, and `capture`.

```js
// prevent is the same as calling e.preventDefault()
html`<form onSubmit.prevent=${callback}>...</form>`;

// you can also add multiple options
html`<form onSubmit.prevent.once=${callback}>...</form>`;
```

> `once` and `capture` are the same options you would pass to `addEventListener`

### Special Attributes

There are what we call special attributes: `text`, `html`, `children`, and `style_`. `text` and `html` are basically just shortened names for `textContent` and `innerHTML`. `children` is like what it is in React, the children of the element.

To avoid rendering user injected strings, instead of using the `{% %}` directive, we can just use the `text` attribute. So the example above could be rewritten as

```js
const str = '<strong>This will render as a text</strong>';
const p = html`<p id="test" text="${str}"></p>`;

render(p, 'body');
console.log(document.getElementById('test').textContent); // <strong>This will render as a text</strong>
```

> Using the non-shortened name e.g. `textContent` would also work.

As discussed earlier, if you want to set a style attribute individually using an object, you need to use `style_`. This is also applicable for attribute names. This is useful when dealing with hooks which will be discussed later.

```js
const header = html`
  <header style_height="30px" style_width="100%" style_display="flex">
    <h1>Title</h1>
  </header>
`;
```

### Lifecycle Methods

Poor Man's JSX also allows you to have lifecycle methods in your elements. The lifecycle methods available are: `create`, `destroy`, `mount`, and `unmount`. To add a lifecycle method, you declare it like an event listener (see example).

Here's a modified example from the [React docs](https://reactjs.org/docs/state-and-lifecycle.html) written with Poor Man's JSX. See it in action [here](https://codesandbox.io/s/poor-man-jsx-lifecycle-n0u3f?file=/src/index.js)

```js
const Clock = () => {
  let date = new Date();
  let timerID;

  const tick = (el) => {
    date = new Date();
    el.textContent = `It is ${date.toLocaleTimeString()}.`;
  };

  const onMount = (e) => {
    timerID = setInterval(tick, 1000, e.target);
  };

  const onUnmount = () => {
    clearInterval(timerID);
  };

  return html`
    <div onMount=${onMount} onUnmount=${onUnmount}>
      <h1>Hello, world!</h1>
      <h2>It is ${date.toLocaleTimeString()}.</h2>
    </div>
  `;
};

render(Clock(), document.body);
```

Lifecycle methods are event listeners so you can also add them manually. Just prefix the lifecycle method name with `@`. You can also access the element it was attached to via `e.target` or as `this`.

```js
const callback = (e) => console.log(e.target);
const div = document.createElement('div');

div.addEventListener('@destroy', callback);
document.body.append(div);
div.remove();

// callback should log
// <div></div>
```

`create` is triggered when an element is created using `render` while `destroy` is triggered when an element is removed from the DOM.

`create` and `destroy` will only be called once unlike `mount` and `unmount` which can be called multiple times if the element is removed or moved (appended elsewhere). This behavior is similar to `connectedCallback` and `disconnectedCallback` of custom elements.

### Data Binding

Poor Man's JSX also allows you to bind an object to an element so that changes in the object is reflected to the elements it was binded to. We call it a `hook`.

To create one, just use `createHook` which returns an array `[proxy, revoke]`. It accepts a primitive or an object. Since under the hood we're using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), we need the `hook` to be an object. By default, the object key will be `value` if a primitive is passed.

```js
import { createHook } from 'poor-man-jsx';

const [hook1] = createHook('test');
console.log(hook1); // Proxy { value: 'test' }

const [hook2, revoke] = createHook({ num: 1 });
console.log(hook2); // Proxy { num: 1 }

// and use revoke to revoke the Proxy and delete the hook from memory
// this will also return the original unproxied object
revoke(); // returns { num: 1 }
```

> Under the hood, we're using `WeakMap` to store data so it's not really necessary to use revoke but use it when you can in a `destroy` or `unmount` callback.

Let's take our Clock example and rewrite it using a hook

```js
const Clock = () => {
  const [state, revoke] = createHook({ date: new Date(), timerID: null });

  const tick = () => {
    state.date = new Date();
  };

  const onMount = () => {
    state.timerID = setInterval(tick, 1000);
  };

  const onUnmount = () => {
    clearInterval(state.timerID);
  };

  return html`
    <div onMount=${onMount} onUnmount=${onUnmount} onDestroy=${revoke}>
      <h1>Hello, world!</h1>
      <h2>It is ${state.$date.toLocaleTimeString()}</h2>
    </div>
  `;
};

render(Clock(), document.body);
```

Let's take a look at the code more closely. _**Hooking**_ an object to element happens in this line

```js
<h2>It is ${state.$date.toLocaleTimeString()}</h2>
```

What this does is that whenever state's `date` changes, the `h2`'s textContent will be updated. Also notice that we're getting `$date` instead of `date`. If we just do `state.date` it will work normally but changes in `date` won't change `h2` and that's why we use `state.$date` instead.

Also, as you see in our `tick` function, we're only changing the value of `state.date`. This is all you need to do and changes will be reflected on `h2`.

> Always prefix the object property you want to hook to an element's property/attribute with `$`

#### Traps

If you need to process the value first before setting it as an element's property or attribute, you can pass a callback to the hook. This callback will have access to the current value as its argument. Like for our previous example, we can also write it as

```js
html`
  <div onMount=${onMount} onUnmount=${onUnmount} onDestroy=${revoke}>
    <h1>Hello, world!</h1>
    <h2>${state.$date((value) => `It is ${value.toLocaleTimeString()}.`)}</h2>
  </div>
`;
```

and it will give the same result. The previous method is much simpler but this is also useful for a lot of cases.

If you just want to run a value's method then do it the previous way. And you can chain this like you would normally

```js
const [hook] = createHook({ nums: [1, 2, 3] });
const list = html`
  <ul>
    ${hook.$nums.map((n) => `<li>Test ${n}</li>`).map((n) => render(n))}
  </ul>
`;
```

> Avoid mutating the value inside traps or it may cause unexpected behaviors

#### Limitations

By default, only one object property can be _hooked_ to an element's property or attribute. So this won't work

```js
html`<div style="display: ${hook.$display}; color: ${hook.$color};"></div>`;
```

because we have two hooks for one attribute which is `style`. So instead use the `style_` attributes we mentioned before

```js
html`<div style_display="${hook.$display}" style_color="${hook.$color}"></div>`;
```

#### Adding hooks to elements

We can also add hooks to manually created (with `document.createElement`) or existing elements using `addHooks`.

```js
const [hook] = createHook('Test');
const p = document.createElement('p');

addHooks(p, { textContent: hook.$value });
document.body.append(p);

console.log(p.textContent); // Test
hook.value = 'Another test';
console.log(p.textContent); // Another test
```

> Make sure that the element is in the document first before making changes.
