import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";
import Expr from "../expr/Expr.js";

export default class While extends Stmt {
  condition: Expr;
  body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    super();

    this.condition = condition;
    this.body = body;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitWhile(this);
  }
}
