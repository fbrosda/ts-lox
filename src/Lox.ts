import { promises as fs } from "fs";
import * as readline from "readline";
import SchemeTranspiler from "./SchemeTranspiler.js";
import Interpreter from "./interpreter/Interpreter.js";
import RuntimeError from "./interpreter/RuntimeError.js";
import Parser from "./parser/Parser.js";
import Scanner from "./scanner/Scanner.js";
import Token from "./scanner/Token.js";
import TokenType from "./scanner/TokenType.js";

export default class Lox {
  static hadError = false;
  static hadRuntimeError = false;
  private static interpreter = new Interpreter();
  private static schemeTranspiler = new SchemeTranspiler();

  static async runScript(path: string, transpile: boolean): Promise<void> {
    const contents = await fs.readFile(path, { encoding: "utf-8" });
    if (transpile) {
      Lox.transpile(contents);
    } else {
      Lox.run(contents);
    }

    if (this.hadError) {
      process.exit(65);
    }
    if (this.hadRuntimeError) {
      process.exit(70);
    }
  }

  static runPrompt(): void {
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt("> ");
    rl.on("line", processLine);
    rl.on("close", () => process.exit(0));

    rl.prompt();

    function processLine(line: string): void {
      Lox.run(line);
      Lox.hadError = false;
      Lox.hadRuntimeError = false;
      rl.prompt();
    }
  }

  private static run(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    if (this.hadError) {
      return;
    } else if (statements !== null) {
      this.interpreter.interpret(statements);
    }
  }

  private static transpile(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    if (this.hadError) {
      return;
    } else if (statements !== null) {
      const ret = this.schemeTranspiler.transpile(statements);
      console.log(ret);
    }
  }

  static error(lineOrToken: number | Token, message: string): void {
    if (lineOrToken instanceof Token) {
      const token = lineOrToken;
      if (token.type === TokenType.EOF) {
        this.report(token.line, " at end", message);
      } else {
        this.report(token.line, ` at '${token.lexeme}'`, message);
      }
    } else {
      const line = lineOrToken;
      this.report(line, "", message);
    }
  }

  static runtimeError(error: RuntimeError): void {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    this.hadRuntimeError = true;
  }

  private static report(line: number, where: string, message: string): void {
    console.error(`[line: ${line}] Error ${where}: ${message}`);
    Lox.hadError = true;
  }
}
