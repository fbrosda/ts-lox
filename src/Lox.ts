import { promises as fs } from "fs";
import * as readline from "readline";

export async function runScript(path: string): Promise<void> {
  const contents = await fs.readFile(path, { encoding: "utf-8" });
  run(contents);
}

export function runPrompt(): void {
  const rl = readline.createInterface(process.stdin, process.stdout);
  rl.setPrompt("> ");
  rl.on("line", processLine);
  rl.on("close", () => process.exit(0));

  rl.prompt();

  function processLine(line: string): void {
    run(line);
    rl.prompt();
  }
}

function run(source: string): void {
  console.log(source);
}
