import Token from "../scanner/Token.js";
import ClassCallable from "./ClassCallable.js";
import LiteralValue from "./LiteralValue.js";

export default class ClassInstance {
  private klass: ClassCallable;
  private fields: Map<string, LiteralValue>;

  constructor(klass: ClassCallable) {
    this.klass = klass;
    this.fields = new Map();
  }

  get(name: Token): LiteralValue {
    const ret = this.fields.get(name.lexeme);
    if (typeof ret !== "undefined") {
      return ret;
    }
    const method = this.klass.findMethod(name);
    return method.bind(this);
  }

  set(name: Token, value: LiteralValue): void {
    this.fields.set(name.lexeme, value);
  }

  toString(): string {
    return `${this.klass} instance`;
  }
}
