import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";

export default class Block extends Stmt {
  statements: Stmt[];

  constructor(statements: Stmt[]) {
    super();

    this.statements = statements;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBlock(this);
  }
}
