import { html, render, apply } from './main';
import { createHook } from './hooks';
import { enableLifecycle } from './lifecycle';

enableLifecycle();

export { html, render, apply, createHook };
