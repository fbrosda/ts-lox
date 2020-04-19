import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class This extends Expr {
  keyword: Token;

  constructor(keyword: Token) {
    super();

    this.keyword = keyword;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitThis(this);
  }
}
