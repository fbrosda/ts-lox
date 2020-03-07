import Expression from "./Expression.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Ternary extends Expression {
  cond: Expression;
  first: Token;
  left: Expression;
  second: Token;
  right: Expression;

  constructor(cond: Expression, first: Token, left: Expression, second: Token, right: Expression) {
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
