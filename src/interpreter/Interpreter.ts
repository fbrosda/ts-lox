import Lox from "../Lox.js";
import Visitor from "../expr/Visitor.js";
import Expr from "../expr/Expr.js";
import Ternary from "../expr/Ternary.js";
import Binary from "../expr/Binary.js";
import Unary from "../expr/Unary.js";
import Grouping from "../expr/Grouping.js";
import Literal from "../expr/Literal.js";
import TokenType from "../scanner/TokenType.js";
import Token from "../scanner/Token.js";
import RuntimeError from "../interpreter/RuntimeError.js";

type LiteralValue = string | number | boolean | null;

export default class Interpreter implements Visitor<LiteralValue> {
  interpret(expression: Expr): void {
    try {
      const value = this.evaluate(expression);
      console.log(this.stringify(value));
    } catch (e) {
      if (e instanceof RuntimeError) {
        Lox.runtimeError(e);
      } else {
        throw e;
      }
    }
  }

  visitLiteral(expression: Literal): LiteralValue {
    return expression.value;
  }

  visitGrouping(expression: Grouping): LiteralValue {
    return this.evaluate(expression.expression);
  }

  visitUnary(expression: Unary): LiteralValue {
    const right = this.evaluate(expression.expression);

    switch (expression.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperands(expression.operator, right);
        return -(right as number);
        break;
      case TokenType.BANG:
        return !this.isTruthy(right);
        break;
    }
    return null;
  }

  visitBinary(expression: Binary): LiteralValue {
    const left = this.evaluate(expression.left);
    const right = this.evaluate(expression.right);

    switch (expression.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperands(expression.operator, left, right);
        return (left as number) - (right as number);
      case TokenType.SLASH:
        this.checkNumberOperands(expression.operator, left, right);
        if (right === 0) {
          throw new RuntimeError(
            expression.operator,
            "Dividing by zero is not possible."
          );
        }
        return (left as number) / (right as number);
      case TokenType.STAR:
        this.checkNumberOperands(expression.operator, left, right);
        return (left as number) * (right as number);
      case TokenType.PLUS:
        if (this.isNumber(left) && this.isNumber(right)) {
          return (left as number) + (right as number);
        }
        if (this.isString(left) || this.isString(right)) {
          return (left as string) + (right as string);
        }
        throw new RuntimeError(
          expression.operator,
          "Operands must be either strings or numbers."
        );
        break;
      case TokenType.GREATER:
        this.checkNumberOperands(expression.operator, left, right);
        return (left as number) > (right as number);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expression.operator, left, right);
        return (left as number) >= (right as number);
      case TokenType.LESS:
        this.checkNumberOperands(expression.operator, left, right);
        return (left as number) < (right as number);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expression.operator, left, right);
        return (left as number) <= (right as number);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      case TokenType.COMMA:
        return right;
    }

    return null;
  }

  visitTernary(expression: Ternary): LiteralValue {
    const cond = this.evaluate(expression.cond);
    if (this.isTruthy(cond)) {
      return this.evaluate(expression.left);
    } else {
      return this.evaluate(expression.right);
    }
  }

  private evaluate(expression: Expr): LiteralValue {
    return expression.accept(this);
  }

  private checkNumberOperands(
    operator: Token,
    ...operands: LiteralValue[]
  ): void {
    if (
      !operands
        .map(operand => this.isNumber(operand))
        .reduce((acc, val) => acc && val, true)
    ) {
      throw new RuntimeError(operator, "All operands must be numbers");
    }
  }

  private isTruthy(val: LiteralValue): boolean {
    if (val === null) {
      return false;
    }
    if (this.isBoolean(val)) {
      return val as boolean;
    }
    return true;
  }

  private isEqual(a: LiteralValue, b: LiteralValue): boolean {
    return a === b;
  }

  private isNumber(val: LiteralValue): boolean {
    return typeof val === "number";
  }

  private isBoolean(val: LiteralValue): boolean {
    return typeof val === "boolean";
  }

  private isString(val: LiteralValue): boolean {
    return typeof val === "string";
  }

  private stringify(val: LiteralValue): string {
    if (val === null) {
      return "nil";
    }
    return val.toString();
  }
}
