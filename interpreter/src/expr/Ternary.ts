import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Ternary extends Expr {
  cond: Expr;
  first: Token;
  left: Expr;
  second: Token;
  right: Expr;

  constructor(
    cond: Expr,
    first: Token,
    left: Expr,
    second: Token,
    right: Expr
  ) {
    super();

    this.cond = cond;
    this.first = first;
    this.left = left;
    this.second = second;
    this.right = right;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitTernary(this);
  }
}
