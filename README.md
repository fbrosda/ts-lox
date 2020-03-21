# About

Implementation of the Lox language from [Crafting
Interpreters](https://www.craftinginterpreters.com/).

# Setup

Build the project with `make build`

To start the REPL go to `./bin` and execute `node index.js`. A script can be
executed with `node index.js <path-to-file>`

Furthermore the AstPrinter from the book was enhanced and converted to a Scheme
Transpiler, which generates executable scheme code. To transpile a script call
`node index.js --scheme <path-to-file>`.

