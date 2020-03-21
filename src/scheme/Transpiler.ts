import Assign from "../expr/Assign.js";
import Binary from "../expr/Binary.js";
import Expr from "../expr/Expr.js";
import Grouping from "../expr/Grouping.js";
import Literal from "../expr/Literal.js";
import Ternary from "../expr/Ternary.js";
import Unary from "../expr/Unary.js";
import Variable from "../expr/Variable.js";
import ExprVisitor from "../expr/Visitor.js";
import Token from "../scanner/Token.js";
import TokenType from "../scanner/TokenType.js";
import Block from "../stmt/Block.js";
import Expression from "../stmt/Expression.js";
import Print from "../stmt/Print.js";
import Stmt from "../stmt/Stmt.js";
import Var from "../stmt/Var.js";
import StmtVisitor from "../stmt/Visitor.js";

export default class Transpiler
  implements ExprVisitor<string>, StmtVisitor<string> {
  private depth = 0;
  transpile(statements: Stmt[]): string {
    let ret = "";
    for (const statement of statements) {
      ret += statement.accept(this);
    }
    return ret;
  }

  visitExpression(statement: Expression): string {
    const val = statement.expression.accept(this);
    return `${val};\n`;
  }

  visitPrint(statement: Print): string {
    const val = statement.expression.accept(this);
    return `(display ${val}) (newline)\n`;
  }

  visitBlock(statement: Block): string {
    let ret = "((lambda ()\n";
    this.depth += 1;
    for (const stmt of statement.statements) {
      ret += this.indent();
      ret += stmt.accept(this);
    }
    this.depth -= 1;
    ret += `${this.indent()}))\n`;
    return ret;
  }

  visitVar(statement: Var): string {
    const val = statement.initializer.accept(this);
    return `(define ${statement.name.lexeme} ${val})\n`;
  }

  visitTernary(expr: Ternary): string {
    return this.parenthesize("if", expr.cond, expr.left, expr.right);
  }

  visitBinary(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGrouping(expr: Grouping): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteral(expr: Literal): string {
    if (expr.value === null) {
      return "nil";
    }
    if (typeof expr.value === "string") {
      return `"${expr.value}"`;
    }
    if (typeof expr.value === "boolean") {
      return `${expr.value ? "#t" : "#f"}`;
    }
    return expr.value.toString();
  }

  visitUnary(expr: Unary): string {
    const right = expr.expression.accept(this);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        return `(- ${right})`;
        break;
      case TokenType.BANG:
        return `(not ${right})`;
        break;
    }
    return "";
  }

  visitVariable(expr: Variable): string {
    return `${expr.name.lexeme}`;
  }

  visitAssign(expr: Assign): string {
    return `(define ${expr.name.lexeme} ${expr.value.accept(this)})`;
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

  private indent(): string {
    let ret = "";
    for (let i = this.depth; i > 0; i--) {
      ret += "  ";
    }
    return ret;
  }

  static main(): void {
    const expression = new Binary(
      new Unary(new Token(TokenType.MINUS, "-", null, 1), new Literal(123)),
      new Token(TokenType.STAR, "*", null, 1),
      new Grouping(new Literal(45.67))
    );

    const statements = [new Expression(expression)];
    console.log(new SchemeTranspiler().transpile(statements));
  }
}
