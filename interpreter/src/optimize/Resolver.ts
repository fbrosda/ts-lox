import { ClassKeyword } from "../const.js";
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
import Interpreter from "../interpreter/Interpreter.js";
import Lox from "../Lox.js";
import Token from "../scanner/Token.js";
import Block from "../stmt/Block.js";
import Break from "../stmt/Break.js";
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

enum ClassType {
  NONE,
  CLASS,
  SUBCLASS,
}
enum FunctionType {
  NONE,
  FUNCTION,
  INITIALIZER,
  METHOD,
}

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private interpreter: Interpreter;
  private scopes: Map<string, boolean>[];
  private currentFunction = FunctionType.NONE;
  private currentClass = ClassType.NONE;
  private loopDepth = 0;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
    this.scopes = [];
  }

  visitBlock(statement: Block): void {
    this.beginScope();
    this.resolve(statement.statements);
    this.endScope();
  }

  visitClass(statement: Class): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    this.declare(statement.name);
    this.define(statement.name);

    if (statement.superclass) {
      this.currentClass = ClassType.SUBCLASS;
      if (statement.name.lexeme === statement.superclass.name.lexeme) {
        Lox.error(
          statement.superclass.name,
          "A class cannot inherit from itself."
        );
      }
      const scope = this.beginScope();
      scope.set(ClassKeyword.SUPER, true);
      this.resolveExpr(statement.superclass);
    }

    const scope = this.beginScope();
    scope.set(ClassKeyword.THIS, true);

    for (const method of statement.methods) {
      const declaration =
        method.name.lexeme === ClassKeyword.INIT
          ? FunctionType.INITIALIZER
          : FunctionType.METHOD;
      this.resolveFunc(method, declaration);
    }
    this.endScope();

    if (statement.superclass) {
      this.endScope();
    }

    this.currentClass = enclosingClass;
  }

  visitBreak(statement: Break): void {
    if (this.loopDepth < 1) {
      Lox.error(statement.name, "Unexpeted break statement.");
    }
    return;
  }

  visitFunc(statement: Func): void {
    this.declare(statement.name);
    this.define(statement.name);

    this.resolveFunc(statement, FunctionType.FUNCTION);
  }

  visitExpression(statement: Expression): void {
    this.resolveExpr(statement.expression);
  }

  visitIf(statement: If): void {
    this.resolveExpr(statement.condition);
    this.resolveStmt(statement.thenBranch);
    if (statement.elseBranch) {
      this.resolveStmt(statement.elseBranch);
    }
  }

  visitPrint(statement: Print): void {
    this.resolveExpr(statement.expression);
  }

  visitReturn(statement: Return): void {
    if (this.currentFunction == FunctionType.NONE) {
      Lox.error(statement.keyword, "Cannot return from top-level code.");
    }
    if (this.isInitializer() && !this.isEmptyReturn(statement)) {
      Lox.error(
        statement.keyword,
        "Cannot return a value from an initializer."
      );
    }
    this.resolveExpr(statement.value);
  }

  visitVar(statement: Var): void {
    this.declare(statement.name);
    this.resolveExpr(statement.initializer);
    this.define(statement.name);
  }

  visitWhile(statement: While): void {
    this.loopDepth++;
    try {
      this.resolveExpr(statement.condition);
      this.resolveStmt(statement.body);
    } finally {
      this.loopDepth--;
    }
  }

  visitAssign(expression: Assign): void {
    this.resolveExpr(expression.value);
    this.resolveLocal(expression, expression.name);
  }

  visitBinary(expression: Binary): void {
    this.resolveExpr(expression.left);
    this.resolveExpr(expression.right);
  }

  visitCall(expression: Call): void {
    this.resolveExpr(expression.callee);
    for (const arg of expression.args) {
      this.resolveExpr(arg);
    }
  }

  visitGetter(expression: Getter): void {
    this.resolveExpr(expression.object);
  }

  visitGrouping(expression: Grouping): void {
    this.resolveExpr(expression.expression);
  }

  visitLiteral(): void {
    return;
  }

  visitLogical(expression: Logical): void {
    this.resolveExpr(expression.left);
    this.resolveExpr(expression.right);
  }

  visitSetter(expression: Setter): void {
    this.resolveExpr(expression.value);
    this.resolveExpr(expression.object);
  }

  visitSuper(expression: Super): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.error(expression.keyword, "Cannot use 'sper' outside of a class.");
    } else if (this.currentClass === ClassType.CLASS) {
      Lox.error(
        expression.keyword,
        "Cannot use 'sper' in a class with no superclass."
      );
    }
    this.resolveLocal(expression, expression.keyword);
  }

  visitTernary(expression: Ternary): void {
    this.resolveExpr(expression.cond);
    this.resolveExpr(expression.left);
    this.resolveExpr(expression.right);
  }

  visitThis(expression: This): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.error(expression.keyword, "Cannot use 'this' outside of a class.");
    }
    this.resolveLocal(expression, expression.keyword);
  }

  visitUnary(expression: Unary): void {
    this.resolveExpr(expression.expression);
  }

  visitVariable(expression: Variable): void {
    const scope = this.getScope();
    if (scope && scope.get(expression.name.lexeme) === false) {
      Lox.error(
        expression.name,
        "Cannot read local variable in its own initailizer."
      );
    }
    this.resolveLocal(expression, expression.name);
  }

  resolve(statements: Stmt[]): void {
    for (const statement of statements) {
      this.resolveStmt(statement);
    }
  }

  private declare(name: Token): void {
    const scope = this.getScope();
    if (scope) {
      if (scope.has(name.lexeme)) {
        Lox.error(
          name,
          "Variable with this name already declared in this scope."
        );
      }
      scope.set(name.lexeme, false);
    }
  }

  private define(name: Token): void {
    const scope = this.getScope();
    if (scope) {
      scope.set(name.lexeme, true);
    }
  }

  private resolveLocal(expression: Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expression, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  private resolveStmt(statement: Stmt): void {
    statement.accept(this);
  }

  private resolveExpr(expression: Expr): void {
    expression.accept(this);
  }

  private resolveFunc(func: Func, type: FunctionType): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;
    this.beginScope();

    for (const param of func.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(func.body);

    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private isInitializer(): boolean {
    return this.currentFunction === FunctionType.INITIALIZER;
  }

  private isEmptyReturn(statement: Return): boolean {
    return statement.value instanceof Literal && statement.value.value === null;
  }

  private beginScope(): Map<string, boolean> {
    const newScope = new Map();
    this.scopes.push(newScope);
    return newScope;
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private getScope(): Map<string, boolean> | null {
    if (this.scopes.length) {
      return this.scopes[this.scopes.length - 1];
    }
    return null;
  }
}
