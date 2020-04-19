import { ClassKeyword } from "../const.js";
import Token from "../scanner/Token.js";
import Callable from "./Callable";
import ClassInstance from "./ClassInstance.js";
import FuncInstance from "./FuncInstance.js";
import Interpreter from "./Interpreter.js";
import LiteralValue from "./LiteralValue.js";
import RuntimeError from "./RuntimeError.js";

export default class ClassCallable implements Callable {
  private name: string;
  private superclass: ClassCallable | null;
  private methods: Map<string, FuncInstance>;

  constructor(
    name: string,
    superclass: ClassCallable | null,
    methods: Map<string, FuncInstance>
  ) {
    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }

  arity(): number {
    const initializer = this.methods.get(ClassKeyword.INIT);
    return initializer ? initializer.arity() : 0;
  }

  exec(interpreter: Interpreter, args: LiteralValue[]): LiteralValue {
    const instance = new ClassInstance(this);

    const initializer = this.methods.get(ClassKeyword.INIT);
    if (initializer) {
      initializer.bind(instance).exec(interpreter, args);
    }

    return instance;
  }

  findMethod(name: Token): FuncInstance {
    const method = this.methods.get(name.lexeme);
    if (typeof method !== "undefined") {
      return method;
    }

    if (this.superclass != null) {
      return this.superclass.findMethod(name);
    }

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }

  toString(): string {
    return this.name;
  }
}
