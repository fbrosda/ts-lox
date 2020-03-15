import Expr from "./expr/Expr.js";
import Visitor from "./expr/Visitor.js";
import Ternary from "./expr/Ternary.js";
import Binary from "./expr/Binary.js";
import Grouping from "./expr/Grouping.js";
import Literal from "./expr/Literal.js";
import Unary from "./expr/Unary.js";
import Token from "./scanner/Token.js";
import TokenType from "./scanner/TokenType.js";

export default class AstPrinter implements Visitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitTernary(expr: Ternary): string {
    const name = expr.first.lexeme + expr.second.lexeme
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

    console.log(new AstPrinter().print(expression));
  }
}
