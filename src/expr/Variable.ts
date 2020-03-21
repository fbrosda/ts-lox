import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Variable extends Expr {
  name: Token;

  constructor(name: Token) {
    super();

    this.name = name;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitVariable(this);
  }
}
