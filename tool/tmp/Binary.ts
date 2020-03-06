import Expression from "./Expression.js;"
import Token from "../scanner/Token.js;"

export default class Binary extends Expression {
  left: Expression;
  operator: Token;
  right: Expression;

  constructor(left: Expression, operator: Token, right: Expression) {
    super();

    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}
