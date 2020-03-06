import Expression from "./Expression.js";
import Token from "../scanner/Token.js";

export default class Unary extends Expression {
  operator: Token;
  expression: Expression;

  constructor(operator: Token, expression: Expression) {
    super();

    this.operator = operator;
    this.expression = expression;
  }
}
