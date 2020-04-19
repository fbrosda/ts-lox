import { ClassKeyword } from "../const.js";
import Func from "../stmt/Func.js";
import Callable from "./Callable.js";
import ClassInstance from "./ClassInstance.js";
import Environment from "./Environment.js";
import Interpreter from "./Interpreter.js";
import LiteralValue from "./LiteralValue.js";

export default class FuncInstance implements Callable {
  private declaration: Func;
  private closure: Environment;
  private isInitializer: boolean;

  constructor(declaration: Func, closure: Environment, isInitializer = false) {
    this.closure = closure;
    this.declaration = declaration;
    this.isInitializer = isInitializer;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  exec(interpreter: Interpreter, args: LiteralValue[]): LiteralValue {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (value) {
      if (this.isInitializer) {
        return this.closure.getAt(0, ClassKeyword.THIS);
      }
      return value;
    }

    if (this.isInitializer) {
      return this.closure.getAt(0, ClassKeyword.THIS);
    }
    return null;
  }

  bind(instance: ClassInstance): FuncInstance {
    const environment = new Environment(this.closure);
    environment.define(ClassKeyword.THIS, instance);
    return new FuncInstance(this.declaration, environment, this.isInitializer);
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
