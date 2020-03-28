import { readFileSync } from "fs";
import Assign from "../expr/Assign.js";
import Binary from "../expr/Binary.js";
import Call from "../expr/Call.js";
import Expr from "../expr/Expr.js";
import Grouping from "../expr/Grouping.js";
import Literal from "../expr/Literal.js";
import Logical from "../expr/Logical.js";
import Ternary from "../expr/Ternary.js";
import Unary from "../expr/Unary.js";
import Variable from "../expr/Variable.js";
import ExprVisitor from "../expr/Visitor.js";
import Token from "../scanner/Token.js";
import TokenType from "../scanner/TokenType.js";
import Block from "../stmt/Block.js";
import Expression from "../stmt/Expression.js";
import Func from "../stmt/Func.js";
import If from "../stmt/If.js";
import Print from "../stmt/Print.js";
import Stmt from "../stmt/Stmt.js";
import Var from "../stmt/Var.js";
import StmtVisitor from "../stmt/Visitor.js";
import While from "../stmt/While.js";
import Return from "../stmt/Return.js";

export default class Transpiler
  implements ExprVisitor<string>, StmtVisitor<string> {
  private depth = 0;

  transpile(statements: Stmt[]): string {
    let ret = this.writeHeader();
    for (const statement of statements) {
      ret += statement.accept(this);
    }
    return ret;
  }

  prettyPrint(statements: Stmt[]): string {
    let ret = "(use-modules (ice-9 pretty-print))\n";
    ret += "(pretty-print '(";
    ret += this.transpile(statements);
    ret += "))";
    return ret;
  }

  visitBreak(): string {
    return `(break)`;
  }

  visitExpression(statement: Expression): string {
    const val = statement.expression.accept(this);
    return `${val}`;
  }

  visitFunc(statement: Func): string {
    let extraParen = 0;
    let ret;
    if (this.depth == 0) {
      ret = `(define ${statement.name.lexeme}`;
    } else {
      ret = `(let ((${statement.name.lexeme}`;
      extraParen = 1;
    }

    const start = this.incIndent();
    ret += `(lambda (`;
    if (statement.params.length) {
      ret += statement.params.map(param => param.lexeme).join(" ");
    }
    ret += " return)";

    this.incIndent();
    ret += this.stringifyBlock(statement.body);

    this.depth += extraParen;
    ret = this.decIndent(ret, this.depth - start);

    this.depth += extraParen;
    return ret;
  }

  visitIf(statement: If): string {
    let ret = `(if ${statement.condition.accept(this)}`;

    this.incIndent();
    ret += `${statement.thenBranch.accept(this)}`;

    if (statement.elseBranch) {
      ret += `${statement.elseBranch.accept(this)}`;
    }
    return this.decIndent(ret);
  }

  visitBlock(statement: Block): string {
    return this.stringifyBlock(statement.statements);
  }

  visitPrint(statement: Print): string {
    const val = statement.expression.accept(this);
    return `(begin (display ${val}) (newline))`;
  }

  visitReturn(statement: Return): string {
    return `(return ${statement.value.accept(this)})`;
  }

  visitVar(statement: Var): string {
    const val = statement.initializer.accept(this);
    if (this.depth == 0) {
      return `(define ${statement.name.lexeme} ${val})`;
    }
    this.incIndent();
    return `(let ((${statement.name.lexeme} ${val}))`;
  }

  visitWhile(statement: While): string {
    let ret = `(while ${statement.condition.accept(this)}`;

    this.incIndent();
    ret += `${statement.body.accept(this)}`;
    return this.decIndent(ret);
  }

  visitAssign(expr: Assign): string {
    return `(set! ${expr.name.lexeme} ${expr.value.accept(this)})`;
  }

  visitBinary(expr: Binary): string {
    let op;
    switch (expr.operator.type) {
      case TokenType.EQUAL_EQUAL:
        op = "eqv?";
        break;
      case TokenType.COMMA:
        op = "begin";
        break;
      case TokenType.PLUS:
        op = "*add*";
        break;
      default:
        op = expr.operator.lexeme;
        break;
    }
    return this.parenthesize(op, expr.left, expr.right);
  }

  visitCall(expr: Call): string {
    let ret = "(call/cc (lambda (return)";
    this.incIndent();
    ret += `(${expr.callee.accept(this)}`;
    if (expr.args.length) {
      ret += " " + expr.args.map(arg => arg.accept(this)).join(" ");
    }
    ret += " return)))";
    this.depth -= 1;
    return ret;
  }

  visitGrouping(expr: Grouping): string {
    return expr.expression.accept(this);
  }

  visitLiteral(expr: Literal): string {
    if (expr.value === null) {
      return "#nil";
    }
    if (typeof expr.value === "string") {
      return `"${expr.value}"`;
    }
    if (typeof expr.value === "boolean") {
      return `${expr.value ? "#t" : "#f"}`;
    }
    return expr.value.toString();
  }

  visitLogical(expr: Logical): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitTernary(expr: Ternary): string {
    return this.parenthesize("if", expr.cond, expr.left, expr.right);
  }

  visitUnary(expr: Unary): string {
    let op;
    if (expr.operator.type === TokenType.BANG) {
      op = "not";
    } else {
      op = expr.operator.lexeme;
    }
    return this.parenthesize(op, expr.expression);
  }

  visitVariable(expr: Variable): string {
    return `${expr.name.lexeme}`;
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    let ret = "";
    ret += `(${name}`;
    for (const expr of exprs) {
      ret += ` ${expr.accept(this)}`;
    }
    ret += ")";

    return ret;
  }

  private stringifyBlock(statements: Stmt[]): string {
    const startDepth = this.incIndent();
    let ret = "(let ()";
    for (const stmt of statements) {
      ret += stmt.accept(this);
    }
    return this.decIndent(ret, this.depth - startDepth);
  }

  private incIndent(): number {
    const prev = this.depth;
    this.depth += 1;
    return prev;
  }

  private decIndent(ret: string, count = 1): string {
    let i = count;
    while (i > 0) {
      ret += ")";
      this.depth -= 1;
      i -= 1;
    }
    return ret;
  }

  private writeHeader(): string {
    let ret = this.createAddHandler();
    ret += this.createClockHandler();
    return ret;
  }

  private createAddHandler(): string {
    return this.loadSchemeFunction("add");
  }

  private createClockHandler(): string {
    return this.loadSchemeFunction("clock");
  }

  private loadSchemeFunction(name: string): string {
    const path = `scheme/${name}.scm`;
    const contents = readFileSync(path, { encoding: "UTF-8" });
    return contents.replace(/\n\s*/g, " ");
  }

  static main(): void {
    const expression = new Binary(
      new Unary(new Token(TokenType.MINUS, "-", null, 1), new Literal(123)),
      new Token(TokenType.STAR, "*", null, 1),
      new Grouping(new Literal(45.67))
    );

    const statements = [new Expression(expression)];
    console.log(new Transpiler().transpile(statements));
  }
}
