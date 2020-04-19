import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Super extends Expr {
  keyword: Token;
  method: Token;

  constructor(keyword: Token, method: Token) {
    super();

    this.keyword = keyword;
    this.method = method;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitSuper(this);
  }
}
