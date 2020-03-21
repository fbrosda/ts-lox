import Lox from "../Lox.js";
import ParseError from "./ParseError.js";
import TokenType from "../scanner/TokenType.js";
import Token from "../scanner/Token.js";
import Expr from "../expr/Expr.js";
import Ternary from "../expr/Ternary.js";
import Binary from "../expr/Binary.js";
import Unary from "../expr/Unary.js";
import Literal from "../expr/Literal.js";
import Grouping from "../expr/Grouping.js";
import Stmt from "../stmt/Stmt.js";
import Print from "../stmt/Print.js";
import Expression from "../stmt/Expression.js";

interface ExpressionF {
  (): Expr;
}

export default class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] | null {
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.statement());
    }
    return statements;
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) {
      return this.printStatement();
    }
    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  private expressionStatement(): Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Expression(value);
  }

  private expression(): Expr {
    return this.condition();
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
    return this.binaryExpression(this.equality.bind(this), TokenType.COMMA);
  }

  private equality(): Expr {
    return this.binaryExpression(
      this.comparison.bind(this),
      TokenType.BANG_EQUAL,
      TokenType.EQUAL_EQUAL
    );
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

    return this.primary();
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
    let expr = handle();

    while (this.match(...operators)) {
      const operator = this.previous();
      const right = handle();
      expr = new Binary(expr, operator, right);
    }
    return expr;
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

  // private synchronize(): void {
  //   this.advance();

  //   while (!this.isAtEnd()) {
  //     if (this.previous().type === TokenType.SEMICOLON) {
  //       return;
  //     }

  //     switch (this.peek().type) {
  //       case TokenType.CLASS:
  //       case TokenType.FUN:
  //       case TokenType.VAR:
  //       case TokenType.FOR:
  //       case TokenType.IF:
  //       case TokenType.WHILE:
  //       case TokenType.PRINT:
  //       case TokenType.RETURN:
  //         return;
  //     }

  //     this.advance();
  //   }
  // }
}
