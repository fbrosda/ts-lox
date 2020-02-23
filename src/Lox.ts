import { promises as fs } from "fs";
import * as readline from "readline";

import Scanner from "./scanner/Scanner.js";

export default class Lox {
  static hadError = false;

  static async runScript(path: string): Promise<void> {
    const contents = await fs.readFile(path, { encoding: "utf-8" });
    Lox.run(contents);

    Lox.hadError = true;
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
      rl.prompt();
    }
  }

  private static run(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    for (const index in tokens) {
      console.log(tokens[index].toString());
    }
  }
  static error(line: number, message: string): void {
    this.report(line, "", message);
  }
  private static report(line: number, where: string, message: string): void {
    console.error(`[line: ${line}] Error ${where}: ${message}`);
    Lox.hadError = true;
  }
}
