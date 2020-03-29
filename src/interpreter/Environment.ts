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

    throw new RuntimeError(name, `Undefined variable '${varName}'.'`);
  }

  getAt(distance: number, name: string): LiteralValue {
    const local = this.ancestor(distance, this);
    if (local) {
      const value = local.values.get(name);
      if (value !== undefined) {
        return value;
      }
    }
    return null;
  }

  assignAt(distance: number, name: Token, value: LiteralValue): void {
    const local = this.ancestor(distance, this);
    if (local) {
      local.values.set(name.lexeme, value);
    }
  }

  private ancestor(
    distance: number,
    environment: Environment | null
  ): Environment | null {
    if (!environment) {
      return null;
    }
    if (distance === 0) {
      return environment;
    }
    return this.ancestor(distance - 1, environment.enclosing);
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
