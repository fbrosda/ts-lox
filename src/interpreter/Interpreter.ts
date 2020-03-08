import Visitor from "../expr/Visitor.js";
import Expression from "../expr/Expression.js";
import Ternary from "../expr/Ternary.js";
import Binary from "../expr/Binary.js";
import Unary from "../expr/Unary.js";
import Grouping from "../expr/Grouping.js";
import Literal from "../expr/Literal.js";
import TokenType from "../scanner/TokenType.js";

type LiteralValue = string | number | boolean | null;

export default class Interpreter implements Visitor<LiteralValue> {
  interpret(expression: Expression): void {
    try {
      const value = this.evaluate(expression);
      console.log(value);
    } catch (e) {
      console.log(e);
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
        return (left as number) - (right as number);
      case TokenType.SLASH:
        return (left as number) / (right as number);
      case TokenType.STAR:
        return (left as number) * (right as number);
      case TokenType.PLUS:
        if (this.isNumber(left) && this.isNumber(right)) {
          return (left as number) + (right as number);
        }
        if (this.isString(left) && this.isString(right)) {
          return (left as string) + (right as string);
        }
        break;
      case TokenType.GREATER:
        return (left as number) > (right as number);
      case TokenType.GREATER_EQUAL:
        return (left as number) >= (right as number);
      case TokenType.LESS:
        return (left as number) < (right as number);
      case TokenType.LESS_EQUAL:
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

  private evaluate(expression: Expression): LiteralValue {
    return expression.accept(this);
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
}
