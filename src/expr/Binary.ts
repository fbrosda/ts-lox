import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Binary extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();

    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBinary(this);
  }
}
