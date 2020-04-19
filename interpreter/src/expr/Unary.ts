import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Unary extends Expr {
  operator: Token;
  expression: Expr;

  constructor(operator: Token, expression: Expr) {
    super();

    this.operator = operator;
    this.expression = expression;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitUnary(this);
  }
}
