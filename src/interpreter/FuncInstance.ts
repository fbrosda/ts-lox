import Callable from "./Callable.js";
import Func from "../stmt/Func.js";
import Interpreter from "./Interpreter.js";
import LiteralValue from "./LiteralValue.js";
import Environment from "./Environment.js";

export default class FuncInstance implements Callable {
  private declaration: Func;

  constructor(declaration: Func) {
    this.declaration = declaration;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  exec(interpreter: Interpreter, args: LiteralValue[]): LiteralValue {
    const environment = new Environment(interpreter.globals);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (value) {
      return value;
    }
    return null;
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
