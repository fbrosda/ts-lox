import Assign from "../expr/Assign.js";
import Binary from "../expr/Binary.js";
import Expr from "../expr/Expr.js";
import Grouping from "../expr/Grouping.js";
import Literal from "../expr/Literal.js";
import Ternary from "../expr/Ternary.js";
import Unary from "../expr/Unary.js";
import Variable from "../expr/Variable.js";
import ExprVisitor from "../expr/Visitor.js";
import Lox from "../Lox.js";
import Token from "../scanner/Token.js";
import TokenType from "../scanner/TokenType.js";
import Block from "../stmt/Block.js";
import Expression from "../stmt/Expression.js";
import Print from "../stmt/Print.js";
import Stmt from "../stmt/Stmt.js";
import Var from "../stmt/Var.js";
import StmtVisitor from "../stmt/Visitor.js";
import RuntimeError from ".//RuntimeError.js";
import Environment from "./Environment.js";
import LiteralValue from "./LiteralValue.js";

export default class Interpreter
  implements ExprVisitor<LiteralValue>, StmtVisitor<void> {
  private environment = new Environment();

  interpret(statements: Stmt[]): void {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (e) {
      if (e instanceof RuntimeError) {
        Lox.runtimeError(e);
      } else {
        throw e;
      }
    }
  }

  visitPrint(statement: Print): void {
    const value = this.evaluate(statement.expression);
    console.log(this.stringify(value));
  }

  visitExpression(statement: Expression): void {
    this.evaluate(statement.expression);
  }

  visitBlock(statement: Block): void {
    this.executeBlock(statement.statements, new Environment(this.environment));
  }

  visitVar(statement: Var): void {
    const value = this.evaluate(statement.initializer);
    this.environment.define(statement.name.lexeme, value);
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

  visitVariable(expression: Variable): LiteralValue {
    return this.environment.get(expression.name);
  }

  visitAssign(expression: Assign): LiteralValue {
    const value = this.evaluate(expression.value);
    this.environment.assign(expression.name, value);
    return value;
  }

  private evaluate(expression: Expr): LiteralValue {
    return expression.accept(this);
  }

  private execute(statement: Stmt): void {
    return statement.accept(this);
  }

  private executeBlock(statements: Stmt[], environment: Environment): void {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
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
