import LiteralValue from "./LiteralValue.js";
import Token from "../scanner/Token.js";
import RuntimeError from "./RuntimeError.js";

export default class Environment {
  private values: Map<string, LiteralValue>;

  constructor() {
    this.values = new Map();
  }

  define(name: string, value: LiteralValue): void {
    this.values.set(name, value);
  }

  get(name: Token): LiteralValue {
    const varName = name.lexeme;
    const value = this.values.get(varName);

    if (typeof value !== "undefined") {
      return value;
    }

    throw new RuntimeError(name, `Undefined variable'${varName}'.'`);
  }

  assign(name: Token, value: LiteralValue): void {
    const varName = name.lexeme;
    if (this.values.has(varName)) {
      this.values.set(varName, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable'${varName}'.'`);
  }
}
