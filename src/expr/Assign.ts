import Expr from "./Expr.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Assign extends Expr {
  name: Token;
  value: Expr;

  constructor(name: Token, value: Expr) {
    super();

    this.name = name;
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitAssign(this);
  }
}
