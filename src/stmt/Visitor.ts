import Block from "./Block.js";
import Break from "./Break.js";
import Expression from "./Expression.js";
import Func from "./Func.js";
import If from "./If.js";
import Print from "./Print.js";
import Return from "./Return.js";
import Var from "./Var.js";
import While from "./While.js";

export default interface Visitor<T> {
  visitBlock(statement: Block): T;
  visitBreak(statement: Break): T;
  visitExpression(statement: Expression): T;
  visitFunc(statement: Func): T;
  visitIf(statement: If): T;
  visitPrint(statement: Print): T;
  visitReturn(statement: Return): T;
  visitVar(statement: Var): T;
  visitWhile(statement: While): T;
}
