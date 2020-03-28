import Callable from "./Callable.js";
import LiteralValue from "./LiteralValue.js";

export default class Clock implements Callable {
  arity(): number {
    return 0;
  }
  exec(): LiteralValue {
    return new Date().getTime() / 1000;
  }
  toString(): string {
    return "<native fn>";
  }
}
