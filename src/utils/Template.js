// The only reason this is created is to easily differentiate
// a normal object from a template object
export default class Template {
  /**
   * Create a template
   * @param {string} template
   * @param {Object} values
   */
  constructor(template, values) {
    this.template = template;
    this.values = values;
  }
}
