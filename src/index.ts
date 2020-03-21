import Lox from "./Lox.js";

main(process.argv.slice(2));

function main(args: string[]): void {
  if (args.length === 2 && args[0] === "--scheme") {
    Lox.runScript(args[1], true);
  } else if (args.length > 1) {
    console.log("Usage: jslox [--scheme] [script]");
    process.exit(64);
  } else if (args.length === 1) {
    Lox.runScript(args[0], false);
  } else {
    Lox.runPrompt();
  }
}
