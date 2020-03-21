import Token from "../scanner/Token.js";
import LiteralValue from "./LiteralValue.js";
import RuntimeError from "./RuntimeError.js";

export default class Environment {
  private enclosing: Environment | null;
  private values: Map<string, LiteralValue>;

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
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

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable'${varName}'.'`);
  }

  assign(name: Token, value: LiteralValue): void {
    const varName = name.lexeme;
    if (this.values.has(varName)) {
      this.values.set(varName, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable'${varName}'.'`);
  }
}
