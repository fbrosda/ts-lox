import Token from "../scanner/Token.js";

export default class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;

    Object.setPrototypeOf(this, RuntimeError.prototype);
  }
}
