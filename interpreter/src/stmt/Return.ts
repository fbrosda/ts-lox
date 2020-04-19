import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";
import Expr from "../expr/Expr.js";
import Token from "../scanner/Token.js";

export default class Return extends Stmt {
  keyword: Token;
  value: Expr;

  constructor(keyword: Token, value: Expr) {
    super();

    this.keyword = keyword;
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitReturn(this);
  }
}
