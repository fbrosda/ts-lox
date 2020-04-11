import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Getter extends Expr {
  object: Expr;
  name: Token;

  constructor(object: Expr, name: Token) {
    super();

    this.object = object;
    this.name = name;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGetter(this);
  }
}
