import Visitor from "./Visitor.js";

export default abstract class Expression {
  abstract accept<T>(visitor: Visitor<T>) : T;
}
