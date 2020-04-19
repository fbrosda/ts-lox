export default class ParseError extends Error {
  constructor() {
    super("");

    Object.setPrototypeOf(this, ParseError.prototype);
  }
}
