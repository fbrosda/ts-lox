import { ClassKeyword, NativeFunc } from "../const.js";
import Assign from "../expr/Assign.js";
import Binary from "../expr/Binary.js";
import Call from "../expr/Call.js";
import Expr from "../expr/Expr.js";
import Getter from "../expr/Getter.js";
import Grouping from "../expr/Grouping.js";
import Literal from "../expr/Literal.js";
import Logical from "../expr/Logical.js";
import Setter from "../expr/Setter.js";
import Super from "../expr/Super.js";
import Ternary from "../expr/Ternary.js";
import This from "../expr/This.js";
import Unary from "../expr/Unary.js";
import Variable from "../expr/Variable.js";
import ExprVisitor from "../expr/Visitor.js";
import Lox from "../Lox.js";
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
import RuntimeError from ".//RuntimeError.js";
import Callable from "./Callable.js";
import ClassCallable from "./ClassCallable.js";
import ClassInstance from "./ClassInstance.js";
import Clock from "./Clock.js";
import Environment from "./Environment.js";
import FuncInstance from "./FuncInstance.js";
import LiteralValue from "./LiteralValue.js";

export default class Interpreter
  implements ExprVisitor<LiteralValue>, StmtVisitor<void>
{
  globals = new Environment();
  private environment = this.globals;
  private locals = new Map<Expr, number>();

  constructor() {
    this.globals.define(NativeFunc.CLOCK, new Clock());
  }

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

  visitBlock(statement: Block): void {
    this.executeBlock(statement.statements, new Environment(this.environment));
  }

  visitClass(statement: Class): void {
    let superclass = null;
    if (statement.superclass) {
      superclass = this.evaluate(statement.superclass);
      if (!this.isClassCallable(superclass)) {
        throw new RuntimeError(
          statement.superclass.name,
          "Superclass must be a class."
        );
      }
    }
    this.environment.define(statement.name.lexeme, null);

    if (statement.superclass) {
      this.environment = new Environment(this.environment);
      this.environment.define(ClassKeyword.SUPER, superclass);
    }

    const methods = new Map<string, FuncInstance>();
    for (const method of statement.methods) {
      const func = new FuncInstance(
        method,
        this.environment,
        method.name.lexeme === ClassKeyword.INIT
      );
      methods.set(method.name.lexeme, func);
    }

    const klass = new ClassCallable(statement.name.lexeme, superclass, methods);
    if (superclass) {
      if (!this.environment.enclosing) {
        throw new RuntimeError(
          statement.name,
          "No enclosing environment available."
        );
      }
      this.environment = this.environment.enclosing;
    }
    this.environment.assign(statement.name, klass);
  }

  visitBreak(): void {
    throw new Error("break");
  }

  visitExpression(statement: Expression): void {
    this.evaluate(statement.expression);
  }

  visitFunc(statement: Func): void {
    const func = new FuncInstance(statement, this.environment);
    this.environment.define(statement.name.lexeme, func);
  }

  visitIf(statement: If): void {
    if (this.isTruthy(this.evaluate(statement.condition))) {
      this.execute(statement.thenBranch);
    } else if (statement.elseBranch) {
      this.execute(statement.elseBranch);
    }
  }

  visitPrint(statement: Print): void {
    const value = this.evaluate(statement.expression);
    console.log(this.stringify(value));
  }

  visitReturn(statement: Return): void {
    const value = this.evaluate(statement.value);
    throw value;
  }

  visitVar(statement: Var): void {
    const value = this.evaluate(statement.initializer);
    this.environment.define(statement.name.lexeme, value);
  }

  visitWhile(statement: While): void {
    while (this.isTruthy(this.evaluate(statement.condition))) {
      try {
        this.execute(statement.body);
      } catch (error) {
        const msg = error.message;
        if (msg === "break") {
          return;
        }
        throw error;
      }
    }
  }

  visitAssign(expression: Assign): LiteralValue {
    const value = this.evaluate(expression.value);
    const distance = this.locals.get(expression);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expression.name, value);
    } else {
      this.globals.assign(expression.name, value);
    }
    return value;
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

  visitCall(expression: Call): LiteralValue {
    const callee = this.evaluate(expression.callee);
    const args = [];
    for (const arg of expression.args) {
      args.push(this.evaluate(arg));
    }

    if (!this.isCallable(callee)) {
      throw new RuntimeError(
        expression.paren,
        "Can only call functions and classes."
      );
    }
    if (args.length != callee.arity()) {
      throw new RuntimeError(
        expression.paren,
        `Expected ${callee.arity()} arguments but got ${args.length}.`
      );
    }
    return callee.exec(this, args);
  }

  visitGetter(expression: Getter): LiteralValue {
    const object = this.evaluate(expression.object);
    if (this.isClassInstance(object)) {
      return object.get(expression.name);
    }

    throw new RuntimeError(expression.name, "Only instances have properties.");
  }

  visitGrouping(expression: Grouping): LiteralValue {
    return this.evaluate(expression.expression);
  }

  visitLiteral(expression: Literal): LiteralValue {
    return expression.value;
  }

  visitLogical(expression: Logical): LiteralValue {
    const left = this.evaluate(expression.left);
    if (expression.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) {
        return left;
      }
    } else {
      if (!this.isTruthy(left)) {
        return left;
      }
    }
    return this.evaluate(expression.right);
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

  visitSetter(expression: Setter): LiteralValue {
    const object = this.evaluate(expression.object);
    if (!this.isClassInstance(object)) {
      throw new RuntimeError(expression.name, "Only instances have fields.");
    }

    const value = this.evaluate(expression.value);
    object.set(expression.name, value);
    return value;
  }

  visitSuper(expression: Super) {
    const distance = this.locals.get(expression);
    if (!distance) {
      throw new RuntimeError(
        expression.keyword,
        "Superclass must be defined, somthing went very wrong."
      );
    }
    const superclass = this.environment.getAt(
      distance,
      ClassKeyword.SUPER
    ) as ClassCallable;
    const instance = this.environment.getAt(
      distance - 1,
      ClassKeyword.THIS
    ) as ClassInstance;
    const method = superclass.findMethod(expression.method);
    return method.bind(instance);
  }

  visitThis(expression: This): LiteralValue {
    return this.lookUpVariable(expression.keyword, expression);
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
    return this.lookUpVariable(expression.name, expression);
  }

  private lookUpVariable(name: Token, expression: Expr): LiteralValue {
    const distance = this.locals.get(expression);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
  }

  private evaluate(expression: Expr): LiteralValue {
    return expression.accept(this);
  }

  private execute(statement: Stmt): void {
    return statement.accept(this);
  }

  resolve(expression: Expr, depth: number): void {
    this.locals.set(expression, depth);
  }

  executeBlock(statements: Stmt[], environment: Environment): void {
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
        .map((operand) => this.isNumber(operand))
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

  private isCallable(callee: LiteralValue): callee is Callable {
    return !!(callee && (callee as Callable).exec);
  }

  private isClassCallable(callee: LiteralValue): callee is ClassCallable {
    return !!(callee && (callee as ClassCallable).findMethod);
  }

  private isClassInstance(object: LiteralValue): object is ClassInstance {
    return !!(object && (object as ClassInstance).get);
  }

  private stringify(val: LiteralValue): string {
    if (val === null) {
      return "nil";
    }
    return val.toString();
  }
}
