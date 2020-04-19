import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Break extends Stmt {
  name: Token;

  constructor(name: Token) {
    super();

    this.name = name;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBreak(this);
  }
}
