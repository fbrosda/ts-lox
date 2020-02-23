import Lox from "../Lox.js";
import Token from "./Token.js";
import TokenType from "./TokenType.js";

export default class Scanner {
  private source: string;
  private tokens: Token[];

  private start = 0;
  private current = 0;
  private line = 1;

  constructor(source: string) {
    this.source = source;
    this.tokens = [];
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case "/":
        if (this.match("/")) {
          while (this.peek() !== "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case '"':
        this.stringToken();
        break;
      case this.getDigit(c):
        this.numberToken();
        break;
      case this.getAlpha(c):
        this.identifier();
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;

      case "\n":
        this.line++;
        break;
      default:
        Lox.error(this.line, "Unexpected character!");
        break;
    }
  }

  private stringToken(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
      }
      this.advance();
    }
    if (this.isAtEnd()) {
      Lox.error(this.line, "Unterminated string!");
    }
    this.advance();

    const text = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, text);
  }

  private numberToken(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const text = this.source.substring(this.start, this.current);
    this.addToken(TokenType.NUMBER, parseFloat(text));
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const keyword = TokenType[text.toUpperCase() as keyof typeof TokenType];

    if (keyword >= 100) {
      this.addToken(keyword);
    } else {
      this.addToken(TokenType.IDENTIFIER);
    }
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private getDigit(c: string): string | undefined {
    return c.match(/^(\d)$/)?.input;
  }

  private isDigit(c: string): boolean {
    return c === this.getDigit(c);
  }

  private getAlpha(c: string): string | undefined {
    return c.match(/^([a-zA-Z_])$/)?.input;
  }

  private isAlpha(c: string): boolean {
    return c === this.getAlpha(c);
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isDigit(c) || this.isAlpha(c);
  }

  private advance(): string {
    this.current++;
    return this.source[this.current - 1];
  }

  private addToken(type: TokenType, literal?: string | number): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal ?? null, this.line));
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    if (this.source[this.current] != expected) {
      return false;
    }

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) {
      return "\0";
    }
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return "\0";
    }
    return this.source[this.current + 1];
  }
}
