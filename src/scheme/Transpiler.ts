import { readFileSync } from "fs";
import { NativeFunc } from "../const.js";
import Assign from "../expr/Assign.js";
import Binary from "../expr/Binary.js";
import Call from "../expr/Call.js";
import Expr from "../expr/Expr.js";
import Getter from "../expr/Getter.js";
import Grouping from "../expr/Grouping.js";
import Literal from "../expr/Literal.js";
import Logical from "../expr/Logical.js";
import Setter from "../expr/Setter.js";
import Ternary from "../expr/Ternary.js";
import This from "../expr/This.js";
import Unary from "../expr/Unary.js";
import Variable from "../expr/Variable.js";
import ExprVisitor from "../expr/Visitor.js";
import Token from "../scanner/Token.js";
import TokenType from "../scanner/TokenType.js";
import Block from "../stmt/Block.js";
import Class from "../stmt/Class.js";
import Expression from "../stmt/Expression.js";
import Func from "../stmt/Func.js";
import If from "../stmt/If.js";
import Print from "../stmt/Print.js";
import Return from "../stmt/Return.js";
import Stmt from "../stmt/Stmt.js";
import Var from "../stmt/Var.js";
import StmtVisitor from "../stmt/Visitor.js";
import While from "../stmt/While.js";

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

  visitBlock(statement: Block): string {
    return this.stringifyBlock(statement.statements);
  }

  visitBreak(): string {
    return `(break)`;
  }

  visitClass(statement: Class): string {
    let ret = `(define-class ${statement.name.lexeme}`;
    for (const method of statement.methods) {
      ret += `(${method.name.lexeme}`;
      ret += ` (${method.params.map(param => param.lexeme).join(" ")}) `;
      ret += this.stringifyBlock(method.body);
      ret += ")";
    }
    ret += ")";
    return ret;
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
    ret += `(lambda (return `;
    if (statement.params.length) {
      ret += statement.params.map(param => param.lexeme).join(" ");
    }
    ret += ")";

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
    let ret = `(*dispatch* ${expr.callee.accept(this)} `;
    if (expr.args.length) {
      ret += expr.args.map(arg => arg.accept(this)).join(" ");
    }
    ret += ")";
    return ret;
  }

  visitGetter(expression: Getter): string {
    return `(field-ref ${expression.object.accept(this)} '${
      expression.name.lexeme
    })`;
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

  visitSetter(expression: Setter): string {
    return `(field-set! ${expression.object.accept(this)} '${
      expression.name.lexeme
    } ${expression.value.accept(this)})`;
  }

  visitThis(expression: This): string {
    return `${expression.keyword.lexeme}`;
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
    let ret = this.modulesHeader();
    ret += this.createAddHandler();
    ret += this.createReturnHandler();
    ret += this.createClassHandler();
    ret += this.createClockHandler();
    ret += this.createDispatchHandler();
    return ret;
  }

  private modulesHeader(): string {
    return this.loadSchemeFunction("modules");
  }

  private createAddHandler(): string {
    return this.loadSchemeFunction("add");
  }

  private createReturnHandler(): string {
    return this.loadSchemeFunction("call-with-return");
  }

  private createClassHandler(): string {
    return this.loadSchemeFunction("class");
  }

  private createClockHandler(): string {
    return this.loadSchemeFunction(NativeFunc.CLOCK);
  }

  private createDispatchHandler(): string {
    return this.loadSchemeFunction("dispatch");
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
