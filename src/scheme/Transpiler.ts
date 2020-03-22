import Assign from "../expr/Assign.js";
import Binary from "../expr/Binary.js";
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
import If from "../stmt/If.js";
import Print from "../stmt/Print.js";
import Stmt from "../stmt/Stmt.js";
import Var from "../stmt/Var.js";
import StmtVisitor from "../stmt/Visitor.js";
import While from "../stmt/While.js";

export default class Transpiler
  implements ExprVisitor<string>, StmtVisitor<string> {
  private depth = 0;
  transpile(statements: Stmt[]): string {
    let ret = "";
    ret += this.createAddHandler();
    for (const statement of statements) {
      ret += statement.accept(this);
    }
    return ret;
  }

  visitPrint(statement: Print): string {
    const val = statement.expression.accept(this);
    return `(begin (display ${val}) (newline))\n`;
  }

  visitExpression(statement: Expression): string {
    const val = statement.expression.accept(this);
    return `${val}\n`;
  }

  visitIf(statement: If): string {
    let ret = `(if ${statement.condition.accept(this)}\n`;

    this.incIndent();
    ret += `${this.indent()}${statement.thenBranch.accept(this)}`;

    if (statement.elseBranch) {
      ret += `${this.indent()}${statement.elseBranch.accept(this)}`;
    }
    return this.decIndent(ret);
  }

  visitBlock(statement: Block): string {
    const startDepth = this.incIndent();
    let ret = "((lambda ()\n";
    for (const stmt of statement.statements) {
      ret += this.indent();
      ret += stmt.accept(this);
    }
    this.incIndent();
    return this.decIndent(ret, this.depth - startDepth);
  }

  visitVar(statement: Var): string {
    const val = statement.initializer.accept(this);
    if (this.depth == 0) {
      return `(define ${statement.name.lexeme} ${val})\n`;
    }
    this.incIndent();
    return `(let ((${statement.name.lexeme} ${val}))\n`;
  }

  visitWhile(statement: While): string {
    let ret = `(while ${statement.condition.accept(this)}\n`;

    this.incIndent();
    ret += `${this.indent()}${statement.body.accept(this)}`;
    return this.decIndent(ret);
  }

  visitTernary(expr: Ternary): string {
    return this.parenthesize("if", expr.cond, expr.left, expr.right);
  }

  visitBinary(expr: Binary): string {
    let op;
    if (expr.operator.type == TokenType.EQUAL_EQUAL) {
      op = "eqv?";
    } else if (expr.operator.type == TokenType.COMMA) {
      op = "begin";
    } else if (expr.operator.type == TokenType.PLUS) {
      op = "add";
    } else {
      op = expr.operator.lexeme;
    }
    return this.parenthesize(op, expr.left, expr.right);
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
    return `(${expr.operator.lexeme} ${expr.left.accept(
      this
    )} ${expr.right.accept(this)})`;
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
    return `(set! ${expr.name.lexeme} ${expr.value.accept(this)})`;
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

  private createAddHandler(): string {
    return `(define add
  (lambda (l r)
    (cond ((and (number? l) (number? r))
           (+ l r))
          ((or (string? l) (string? r))
           (string-append
             (format #f "~a" l)
             (format #f "~a" r)))
          (else (throw 'invalidArgs "Operands must be either strings or numbers.")))))
\n`;
  }

  private incIndent(): number {
    const prev = this.depth;
    this.depth += 1;
    return prev;
  }

  private decIndent(ret: string, count = 1): string {
    let i = count;
    ret = ret.slice(0, ret.length - 1);
    while (i > 0) {
      ret += ")";
      this.depth -= 1;
      i -= 1;
    }
    ret += "\n";
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
    console.log(new Transpiler().transpile(statements));
  }
}
