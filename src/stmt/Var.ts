import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";
import Expr from "../expr/Expr.js";
import Token from "../scanner/Token.js";

export default class Var extends Stmt {
  name: Token;
  initializer: Expr;

  constructor(name: Token, initializer: Expr) {
    super();

    this.name = name;
    this.initializer = initializer;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitVar(this);
  }
}
