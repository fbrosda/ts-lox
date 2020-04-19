import Lox from "./Lox.js";

main(process.argv.slice(2));

function main(args: string[]): void {
  const transpile = args.indexOf("--scheme") > -1;
  const pretty = args.indexOf("--pretty") > -1;

  if (transpile) {
    Lox.runScript(args[args.length - 1], pretty);
  } else if (args.length > 1) {
    console.log("Usage: jslox [--scheme [--pretty]] [script]");
    process.exit(64);
  } else if (args.length === 1) {
    Lox.runScript(args[0], null);
  } else {
    Lox.runPrompt();
  }
}
