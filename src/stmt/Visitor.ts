import Expression from "./Expression.js";
import Print from "./Print.js";
import Var from "./Var.js";

export default interface Visitor<T> {
  visitExpression(statement: Expression): T;
  visitPrint(statement: Print): T;
  visitVar(statement: Var): T;
}
