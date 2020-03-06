import Expression from "./Expression.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Unary extends Expression {
  operator: Token;
  expression: Expression;

  constructor(operator: Token, expression: Expression) {
    super();

    this.operator = operator;
    this.expression = expression;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitUnary(this);
  }
}
