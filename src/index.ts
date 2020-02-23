import { runScript, runPrompt } from './Lox.js';

main(process.argv.slice(2));

function main(args: string[]): void {
  if (args.length > 1) {
    console.log("Usage: jslox [script]");
    process.exit(64);
  } else if (args.length === 1) {
    runScript(args[0]);
  } else {
    runPrompt();
  }
}
