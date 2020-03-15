import Expr from "./Expr.js";
import Visitor from "./Visitor.js";

export default class Literal extends Expr {
  value: string | number | boolean | null;

  constructor(value: string | number | boolean | null) {
    super();

    this.value = value;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitLiteral(this);
  }
}
