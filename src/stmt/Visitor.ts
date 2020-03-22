import Block from "./Block.js";
import Expression from "./Expression.js";
import If from "./If.js";
import Print from "./Print.js";
import Var from "./Var.js";

export default interface Visitor<T> {
  visitBlock(statement: Block): T;
  visitExpression(statement: Expression): T;
  visitIf(statement: If): T;
  visitPrint(statement: Print): T;
  visitVar(statement: Var): T;
}
