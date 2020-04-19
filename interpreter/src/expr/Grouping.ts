import Expr from "./Expr.js";
import Visitor from "./Visitor.js";

export default class Grouping extends Expr {
  expression: Expr;

  constructor(expression: Expr) {
    super();

    this.expression = expression;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGrouping(this);
  }
}
