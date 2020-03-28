import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";

export default class Break extends Stmt {
  constructor() {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBreak(this);
  }
}
