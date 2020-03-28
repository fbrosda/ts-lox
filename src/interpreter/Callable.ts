import LiteralValue from "./LiteralValue.js";
import Interpreter from "./Interpreter.js";

export default interface Callable {
  arity(): number;
  exec(Interpreter: Interpreter, args: LiteralValue[]): LiteralValue;
  toString(): string;
}
