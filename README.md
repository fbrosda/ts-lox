# About

Implementation of the Lox language from [Crafting
Interpreters](https://www.craftinginterpreters.com/).

## Structure

The interpreter from the first part of the book is found in `interpreter/` and
is implemented in javascript.

The virtual machine is found in `vm`, implemented in C and compiled to
webassembly.

`server` contains a simple node server, to deliver the files to the browser.

## Run the project

Start the server with `node index.js`
