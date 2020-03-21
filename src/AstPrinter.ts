import Expr from "./expr/Expr.js";
import ExprVisitor from "./expr/Visitor.js";
import Ternary from "./expr/Ternary.js";
import Binary from "./expr/Binary.js";
import Grouping from "./expr/Grouping.js";
import Literal from "./expr/Literal.js";
import Unary from "./expr/Unary.js";
import Token from "./scanner/Token.js";
import TokenType from "./scanner/TokenType.js";
import StmtVisitor from "./stmt/Visitor.js";
import Stmt from "./stmt/Stmt.js";
import Expression from "./stmt/Expression.js";
import Print from "./stmt/Print.js";

export default class AstPrinter
  implements ExprVisitor<string>, StmtVisitor<string> {
  print(statements: Stmt[]): string {
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
    return `PRINT ${val};\n`;
  }

  visitTernary(expr: Ternary): string {
    const name = expr.first.lexeme + expr.second.lexeme;
    return this.parenthesize(name, expr.cond, expr.left, expr.right);
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
    return expr.value.toString();
  }

  visitUnary(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.expression);
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

  static main(): void {
    const expression = new Binary(
      new Unary(new Token(TokenType.MINUS, "-", null, 1), new Literal(123)),
      new Token(TokenType.STAR, "*", null, 1),
      new Grouping(new Literal(45.67))
    );

    const statements = [new Expression(expression)];
    console.log(new AstPrinter().print(statements));
  }
}
