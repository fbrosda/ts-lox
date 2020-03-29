import Assign from "../expr/Assign.js";
import Binary from "../expr/Binary.js";
import Call from "../expr/Call.js";
import Expr from "../expr/Expr.js";
import Grouping from "../expr/Grouping.js";
import Logical from "../expr/Logical.js";
import Ternary from "../expr/Ternary.js";
import Unary from "../expr/Unary.js";
import Variable from "../expr/Variable.js";
import ExprVisitor from "../expr/Visitor.js";
import Interpreter from "../interpreter/Interpreter.js";
import Lox from "../Lox.js";
import Token from "../scanner/Token.js";
import Block from "../stmt/Block.js";
import Expression from "../stmt/Expression.js";
import Func from "../stmt/Func.js";
import If from "../stmt/If.js";
import Print from "../stmt/Print.js";
import Return from "../stmt/Return.js";
import Stmt from "../stmt/Stmt.js";
import Var from "../stmt/Var.js";
import StmtVisitor from "../stmt/Visitor.js";
import While from "../stmt/While.js";
import Break from "../stmt/Break.js";

enum FunctionType {
  NONE,
  FUNCTION
}

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private interpreter: Interpreter;
  private scopes: Map<string, boolean>[];
  private currentFunction = FunctionType.NONE;
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

  visitTernary(expression: Ternary): void {
    this.resolveExpr(expression.cond);
    this.resolveExpr(expression.left);
    this.resolveExpr(expression.right);
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

  private beginScope(): void {
    this.scopes.push(new Map());
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
