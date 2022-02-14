export default class Template {
  /**
   * Create a template
   * @param {String} str - an html string
   * @param {Array} handlers - an array of handlers
   * @param {Objet} dict - key-value pairs; values are functions and hooks
   */
  constructor(str, handlers, dict) {
    this.str = str;
    this.handlers = handlers;
    this.dict = dict;
  }
}
