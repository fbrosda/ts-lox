import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Call extends Expr {
  callee: Expr;
  paren: Token;
  args: Expr[];

  constructor(callee: Expr, paren: Token, args: Expr[]) {
    super();

    this.callee = callee;
    this.paren = paren;
    this.args = args;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitCall(this);
  }
}
