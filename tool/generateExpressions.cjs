const fs = require("fs").promises;

const TYPES = {
  Binary: "Expression: left, Token: operator, Expression: right",
  Grouping: "Expression: expression",
  Literal: "string | number | boolean | null: value",
  Unary: "Token: operator, Expression: expression"
};

const DIR = "../src/expr";

for (const [key, value] of Object.entries(TYPES)) {
  generateTypeClass(key, value);
}

generateVisitorClass();

async function generateTypeClass(name, parameter) {
  const parameterList = parameter.split(",").map(param =>
    param
      .trim()
      .split(":")
      .map(x => x.trim())
  );
  let ret = "";

  ret += 'import Expression from "./Expression.js";\n';
  ret += 'import Visitor from "./Visitor.js";\n';
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

  ret += "\n";
  ret += "  accept<T>(visitor: Visitor<T>): T {\n";
  ret += `    return visitor.visit${name}(this);\n`;
  ret += "  }\n";

  ret += "}\n";

  await fs.writeFile(`${DIR}/${name}.ts`, ret);
}

async function generateVisitorClass() {
  let ret = "";
  for (const key of Object.keys(TYPES)) {
    ret += `import ${key} from "./${key}.js";\n`;
  }

  ret += "\n";
  ret += "export default interface Visitor<T> {\n";
  for (const key of Object.keys(TYPES)) {
    ret += `  visit${key}(expression: ${key}): T;\n`;
  }
  ret += "}\n";

  await fs.writeFile(`${DIR}/Visitor.ts`, ret);
}
