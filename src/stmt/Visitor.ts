import Expression from "./Expression.js";
import Print from "./Print.js";

export default interface Visitor<T> {
  visitExpression(statement: Expression): T;
  visitPrint(statement: Print): T;
}
