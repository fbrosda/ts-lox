import Lox from "./Lox.js";
// import AstPrinter from "./AstPrinter.js"

// AstPrinter.main();
main(process.argv.slice(2));

function main(args: string[]): void {
  if (args.length > 1) {
    console.log("Usage: jslox [script]");
    process.exit(64);
  } else if (args.length === 1) {
    Lox.runScript(args[0]);
  } else {
    Lox.runPrompt();
  }
}
