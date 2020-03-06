const fs = require("fs").promises;

const TYPES = {
  Binary: "Expression left, Token operator, Expression right",
  Grouping: "Expression expression",
  Literal: "Object value",
  Unary: "Token operator, Expression expression"
};

const DIR = "../src/expr";

for (const [key, value] of Object.entries(TYPES)) {
  generateTypeClass(key, value);
}

async function generateTypeClass(name, parameter) {
  const parameterList = parameter
    .split(",")
    .map(param => param.trim().split(" "));
  let ret = "";

  ret += 'import Expression from "./Expression.js";\n';
  if (parameter.includes("Token")) {
    ret += 'import Token from "../scanner/Token.js";\n';
  }
  ret += "\n";
  ret += `export default class ${name} extends Expression {\n`;

  for (const [pType, pName] of parameterList) {
    ret += `  ${pName}: ${pType};\n`;
  }

  ret += "\n";
  ret += "  constructor(";
  let isFirst = true;
  for (const [pType, pName] of parameterList) {
    if (!isFirst) {
      ret += ", ";
    }
    isFirst = false;
    ret += `${pName}: ${pType}`;
  }
  ret += ") {\n";
  ret += "    super();\n";
  ret += "\n";
  for (const [pType, pName] of parameterList) {
    ret += `    this.${pName} = ${pName};\n`;
  }

  ret += "  }\n";
  ret += "}\n";

  await fs.writeFile(`${DIR}/${name}.ts`, ret);
}
