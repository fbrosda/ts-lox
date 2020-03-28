import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";

export default class Func extends Stmt {
  name: Token;
  params: Token[];
  body: Stmt[];

  constructor(name: Token, params: Token[], body: Stmt[]) {
    super();

    this.name = name;
    this.params = params;
    this.body = body;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitFunc(this);
  }
}
