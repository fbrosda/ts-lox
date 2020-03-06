import Expression from "./Expression.js";
import Visitor from "./Visitor.js";

export default class Grouping extends Expression {
  expression: Expression;

  constructor(expression: Expression) {
    super();

    this.expression = expression;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGrouping(this);
  }
}
