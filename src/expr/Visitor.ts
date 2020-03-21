import Ternary from "./Ternary.js";
import Binary from "./Binary.js";
import Unary from "./Unary.js";
import Grouping from "./Grouping.js";
import Literal from "./Literal.js";
import Variable from "./Variable.js";

export default interface Visitor<T> {
  visitTernary(expression: Ternary): T;
  visitBinary(expression: Binary): T;
  visitUnary(expression: Unary): T;
  visitGrouping(expression: Grouping): T;
  visitLiteral(expression: Literal): T;
  visitVariable(expression: Variable): T;
}
