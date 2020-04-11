const fs = require("fs").promises;

const DIR = "./src/expr";
const PAD = "  ";
const EXPR = "Expr";
const VISITOR = "Visitor";

const TYPES = {
  Assign: `Token: name, ${EXPR}: value`,
  Binary: `${EXPR}: left, Token: operator, ${EXPR}: right`,
  Call: `${EXPR}: callee, Token: paren, ${EXPR}[]: args`,
  Getter: `${EXPR}: object, Token: name`,
  Grouping: `${EXPR}: expression`,
  Literal: "string | number | boolean | null: value",
  Logical: `${EXPR}: left, Token: operator, ${EXPR}: right`,
  Setter: `${EXPR}: object, Token: name, ${EXPR}: value`,
  Ternary: `${EXPR}: cond, Token: first, ${EXPR}: left, Token: second, ${EXPR}: right`,
  This: `Token: keyword`,
  Unary: `Token: operator, ${EXPR}: expression`,
  Variable: "Token: name"
};

generateExpressionClass();
generateVisitorClass();

for (const [key, value] of Object.entries(TYPES)) {
  generateTypeClass(key, value);
}

async function generateExpressionClass() {
  let ret = "";
  ret += `import ${VISITOR} from "./${VISITOR}.js";\n`;

  ret += "\n";
  ret += `export default abstract class ${EXPR} {\n`;
  ret += `${PAD}abstract accept<T>(visitor: ${VISITOR}<T>) : T;\n`;
  ret += "}\n";

  await fs.writeFile(`${DIR}/${EXPR}.ts`, ret);
}

async function generateVisitorClass() {
  let ret = "";
  for (const key of Object.keys(TYPES)) {
    ret += `import ${key} from "./${key}.js";\n`;
  }

  ret += "\n";
  ret += `export default interface ${VISITOR}<T> {\n`;
  for (const key of Object.keys(TYPES)) {
    ret += `  visit${key}(expression: ${key}): T;\n`;
  }
  ret += "}\n";

  await fs.writeFile(`${DIR}/${VISITOR}.ts`, ret);
}

async function generateTypeClass(name, parameter) {
  const parameterList = parameter.split(",").map(param =>
    param
      .trim()
      .split(":")
      .map(x => x.trim())
  );
  let ret = "";

  ret += writeImports();

  ret += "\n";
  ret += `export default class ${name} extends ${EXPR} {\n`;

  ret += writeMembers();

  ret += writeConstructor();

  ret += writeAcceptFunction();

  ret += "}\n";

  await fs.writeFile(`${DIR}/${name}.ts`, ret);

  function writeImports() {
    let tmp = "";
    tmp += `import ${EXPR} from "./${EXPR}.js";\n`;
    tmp += `import ${VISITOR} from "./${VISITOR}.js";\n`;
    if (parameter.includes("Token")) {
      tmp += 'import Token from "../scanner/Token.js";\n';
    }
    return tmp;
  }

  function writeMembers() {
    let tmp = "";
    for (const [pType, pName] of parameterList) {
      tmp += `${PAD}${pName}: ${pType};\n`;
    }
    return tmp;
  }

  function writeConstructor() {
    let tmp = "";
    tmp += "\n";
    tmp += `${PAD}constructor(`;
    let isFirst = true;
    for (const [pType, pName] of parameterList) {
      if (!isFirst) {
        tmp += ", ";
      }
      isFirst = false;
      tmp += `${pName}: ${pType}`;
    }
    tmp += ") {\n";

    tmp += `${PAD}${PAD}super();\n`;

    tmp += "\n";
    for (const [pType, pName] of parameterList) {
      tmp += `${PAD}${PAD}this.${pName} = ${pName};\n`;
    }

    tmp += `${PAD}}\n`;
    return tmp;
  }

  function writeAcceptFunction() {
    let tmp = "";
    tmp += "\n";
    tmp += `${PAD}accept<T>(visitor: ${VISITOR}<T>): T {\n`;
    tmp += `${PAD}${PAD}return visitor.visit${name}(this);\n`;
    tmp += `${PAD}}\n`;
    return tmp;
  }
}
