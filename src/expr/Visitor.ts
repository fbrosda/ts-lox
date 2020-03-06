import Binary from "./Binary.js";
import Grouping from "./Grouping.js";
import Literal from "./Literal.js";
import Unary from "./Unary.js";

export default interface Visitor<T> {
  visitBinary(expression: Binary): T;
  visitGrouping(expression: Grouping): T;
  visitLiteral(expression: Literal): T;
  visitUnary(expression: Unary): T;
}
