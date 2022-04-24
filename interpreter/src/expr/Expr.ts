import Visitor from "./Visitor.js";

export default abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T;
}
