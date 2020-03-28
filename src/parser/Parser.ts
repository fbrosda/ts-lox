import Assign from "../expr/Assign.js";
import Binary from "../expr/Binary.js";
import Call from "../expr/Call.js";
import Expr from "../expr/Expr.js";
import Grouping from "../expr/Grouping.js";
import Literal from "../expr/Literal.js";
import Logical from "../expr/Logical.js";
import Ternary from "../expr/Ternary.js";
import Unary from "../expr/Unary.js";
import Variable from "../expr/Variable.js";
import Lox from "../Lox.js";
import Token from "../scanner/Token.js";
import TokenType from "../scanner/TokenType.js";
import Block from "../stmt/Block.js";
import Break from "../stmt/Break.js";
import Expression from "../stmt/Expression.js";
import If from "../stmt/If.js";
import Print from "../stmt/Print.js";
import Stmt from "../stmt/Stmt.js";
import Var from "../stmt/Var.js";
import While from "../stmt/While.js";
import ParseError from "./ParseError.js";

const MAX_ARGS_LENGTH = 255;
interface ExpressionF {
  (): Expr;
}

export default class Parser {
  private tokens: Token[];
  private current = 0;
  private loopDepth = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] | null {
    const statements = [];
    while (!this.isAtEnd()) {
      const statement = this.declaration();
      if (statement) {
        statements.push(statement);
      }
    }
    return statements;
  }

  private declaration(): Stmt | null {
    try {
      if (this.match(TokenType.VAR)) {
        return this.varDeclaration();
      }
      return this.statement();
    } catch (e) {
      if (e instanceof ParseError) {
        this.synchronize();
        return null;
      } else {
        throw e;
      }
    }
  }

  private statement(): Stmt {
    if (this.match(TokenType.BREAK)) {
      return this.breakStatement();
    }
    if (this.match(TokenType.FOR)) {
      return this.forStatement();
    }
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }
    if (this.match(TokenType.PRINT)) {
      return this.printStatement();
    }
    if (this.match(TokenType.WHILE)) {
      return this.whileStatement();
    }
    if (this.match(TokenType.LEFT_BRACE)) {
      return new Block(this.block());
    }
    return this.expressionStatement();
  }

  private breakStatement(): Stmt {
    if (this.loopDepth < 1) {
      this.error(this.previous(), "Unexpeted break statement.");
    }
    this.consumeSemicolon();
    return new Break();
  }

  private forStatement(): Stmt {
    this.loopDepth++;
    try {
      this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

      let initializer;
      if (this.match(TokenType.SEMICOLON)) {
        initializer = null;
      } else if (this.match(TokenType.VAR)) {
        initializer = this.varDeclaration();
      } else {
        initializer = this.expressionStatement();
      }

      let condition;
      if (this.match(TokenType.SEMICOLON)) {
        condition = new Literal(true);
      } else {
        condition = this.expression();
      }
      this.consumeSemicolon();

      let increment = null;
      if (!this.match(TokenType.RIGHT_PAREN)) {
        increment = this.expression();
      }
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clause.");

      let body = this.statement();
      if (increment) {
        body = new Block([body, new Expression(increment)]);
      }
      body = new While(condition, body);
      if (initializer) {
        body = new Block([initializer, body]);
      }
      return body;
    } finally {
      this.loopDepth--;
    }
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }
    return new If(condition, thenBranch, elseBranch);
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consumeSemicolon();
    return new Print(value);
  }

  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

    const initializer = this.match(TokenType.EQUAL)
      ? this.expression()
      : new Literal(null);
    this.consumeSemicolon();
    return new Var(name, initializer);
  }

  private whileStatement(): Stmt {
    this.loopDepth++;
    try {
      this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
      const condition = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
      const body = this.statement();

      return new While(condition, body);
    } finally {
      this.loopDepth--;
    }
  }

  private expressionStatement(): Stmt {
    const value = this.expression();
    this.consumeSemicolon();
    return new Expression(value);
  }

  private block(): Stmt[] {
    const statements = [];

    while (!this.check(TokenType.RIGHT_BRACE)) {
      const statement = this.declaration();
      if (statement) {
        statements.push(statement);
      }
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");

    return statements;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.condition();
    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Variable) {
        const name = (expr as Variable).name;
        return new Assign(name, value);
      }

      this.error(equals, "Invalid assignemnt target.");
    }
    return expr;
  }

  private condition(): Expr {
    let expr = this.comma();
    if (this.match(TokenType.QUESTIONMARK)) {
      const firstOp = this.previous();
      const left = this.expression();
      if (this.match(TokenType.COLON)) {
        const secondOp = this.previous();
        const right = this.condition();

        expr = new Ternary(expr, firstOp, left, secondOp, right);
      } else {
        throw this.error(this.peek(), "Expect ':' of ternary operator.");
      }
    }
    return expr;
  }

  private comma(): Expr {
    return this.binaryExpression(this.or.bind(this), TokenType.COMMA);
  }

  private or(): Expr {
    return this.logicalExpression(this.and.bind(this), TokenType.OR);
  }

  private and(): Expr {
    return this.logicalExpression(this.equality.bind(this), TokenType.AND);
  }

  private equality(): Expr {
    let left = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      if (operator.type === TokenType.EQUAL_EQUAL) {
        left = new Binary(left, operator, right);
      } else {
        // Transform a != b to !(a == b)
        // Makes the transpiler a bit easier, as '!=' does not exist in scheme
        operator.lexeme = "==";
        operator.type = TokenType.EQUAL_EQUAL;

        left = new Binary(left, operator, right);
        left = new Unary(
          new Token(TokenType.BANG, "!", null, operator.line),
          left
        );
      }
    }
    return left;
  }

  private comparison(): Expr {
    return this.binaryExpression(
      this.addition.bind(this),
      TokenType.GREATER,
      TokenType.GREATER_EQUAL,
      TokenType.LESS,
      TokenType.LESS_EQUAL
    );
  }

  private addition(): Expr {
    return this.binaryExpression(
      this.multiplication.bind(this),
      TokenType.MINUS,
      TokenType.PLUS
    );
  }

  private multiplication(): Expr {
    return this.binaryExpression(
      this.unary.bind(this),
      TokenType.SLASH,
      TokenType.STAR
    );
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();
    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }
    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length > MAX_ARGS_LENGTH) {
          this.error(
            this.peek(),
            `Cannot have more than ${MAX_ARGS_LENGTH} arguments.`
          );
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments."
    );
    return new Call(callee, paren, args);
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) {
      return new Literal(false);
    }
    if (this.match(TokenType.TRUE)) {
      return new Literal(true);
    }
    if (this.match(TokenType.NIL)) {
      return new Literal(null);
    }

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression");
      return new Grouping(expr);
    }

    // Error productions.
    if (
      this.errorProduction(
        this.equality.bind(this),
        TokenType.BANG_EQUAL,
        TokenType.EQUAL_EQUAL
      ) ||
      this.errorProduction(
        this.comparison.bind(this),
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      ) ||
      this.errorProduction(this.addition.bind(this), TokenType.PLUS) ||
      this.errorProduction(
        this.multiplication.bind(this),
        TokenType.SLASH,
        TokenType.STAR
      )
    ) {
      throw new ParseError();
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private binaryExpression(
    handle: ExpressionF,
    ...operators: TokenType[]
  ): Expr {
    return this.binaryOrLogicalExpression(Binary, handle, ...operators);
  }

  private logicalExpression(
    handle: ExpressionF,
    ...operators: TokenType[]
  ): Expr {
    return this.binaryOrLogicalExpression(Logical, handle, ...operators);
  }

  private binaryOrLogicalExpression(
    ctor: typeof Binary | typeof Logical,
    handle: ExpressionF,
    ...operators: TokenType[]
  ): Expr {
    let left = handle();

    while (this.match(...operators)) {
      const operator = this.previous();
      const right = handle();
      left = new ctor(left, operator, right);
    }
    return left;
  }

  private errorProduction(handle: ExpressionF, ...types: TokenType[]): boolean {
    if (this.match(...types)) {
      this.error(this.previous(), "Missing left-hand operand.");
      handle();
      return true;
    }
    return false;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(this.peek(), message);
  }

  private consumeSemicolon(): void {
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type == TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): Error {
    Lox.error(token, message);
    return new ParseError();
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) {
        return;
      }

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}
