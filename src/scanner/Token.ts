import TokenType from "./TokenType.js";

export default class Token {
  type: TokenType;
  lexeme: string;
  literal?: string | number;
  line: number;

  constructor(
    type: TokenType,
    lexeme: string,
    literal: string | number | null,
    line: number
  ) {
    this.type = type;
    this.lexeme = lexeme;
    if (literal) {
      this.literal = literal;
    }
    this.line = line;
  }

  toString(): string {
    return `${TokenType[this.type]} ${this.lexeme} ${this.literal ?? ""}`;
  }
}
