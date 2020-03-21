import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";
import Expr from "../expr/Expr.js";

export default class Expression extends Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    super();

    this.expression = expression;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitExpression(this);
  }
}
