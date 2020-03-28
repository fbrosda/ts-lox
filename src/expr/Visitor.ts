import Assign from "./Assign.js";
import Binary from "./Binary.js";
import Call from "./Call.js";
import Grouping from "./Grouping.js";
import Literal from "./Literal.js";
import Logical from "./Logical.js";
import Ternary from "./Ternary.js";
import Unary from "./Unary.js";
import Variable from "./Variable.js";

export default interface Visitor<T> {
  visitAssign(expression: Assign): T;
  visitBinary(expression: Binary): T;
  visitCall(expression: Call): T;
  visitGrouping(expression: Grouping): T;
  visitLiteral(expression: Literal): T;
  visitLogical(expression: Logical): T;
  visitTernary(expression: Ternary): T;
  visitUnary(expression: Unary): T;
  visitVariable(expression: Variable): T;
}
