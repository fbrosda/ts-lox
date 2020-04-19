const fs = require("fs").promises;

const DIR = "./src/stmt";
const PAD = "  ";
const EXPR = "Expr";
const STMT = "Stmt";
const VISITOR = "Visitor";

const TYPES = {
  Block: `${STMT}[]: statements`,
  Break: `Token: name`,
  Class: `Token: name, Variable | null: superclass, Func[]: methods`,
  Expression: `${EXPR}: expression`,
  Func: `Token: name, Token[]: params, ${STMT}[]: body`,
  If: `${EXPR}: condition, ${STMT}: thenBranch, ${STMT} | null: elseBranch`,
  Print: `${EXPR}: expression`,
  Return: `Token: keyword, ${EXPR}: value`,
  Var: `Token: name, ${EXPR}: initializer`,
  While: `${EXPR}: condition, ${STMT}: body`
};

generateStatementClass();
generateVisitorClass();

for (const [key, value] of Object.entries(TYPES)) {
  generateTypeClass(key, value);
}

async function generateStatementClass() {
  let ret = "";
  ret += `import ${VISITOR} from "./${VISITOR}.js";\n`;

  ret += "\n";
  ret += `export default abstract class ${STMT} {\n`;
  ret += `${PAD}abstract accept<T>(visitor: ${VISITOR}<T>) : T;\n`;
  ret += "}\n";

  await fs.writeFile(`${DIR}/${STMT}.ts`, ret);
}

async function generateVisitorClass() {
  let ret = "";
  for (const key of Object.keys(TYPES)) {
    ret += `import ${key} from "./${key}.js";\n`;
  }

  ret += "\n";
  ret += `export default interface ${VISITOR}<T> {\n`;
  for (const key of Object.keys(TYPES)) {
    ret += `  visit${key}(statement: ${key}): T;\n`;
  }
  ret += "}\n";

  await fs.writeFile(`${DIR}/${VISITOR}.ts`, ret);
}

async function generateTypeClass(name, parameter) {
  const parameterList = parameter.split(",").map(param =>
    !param
      ? []
      : param
          .trim()
          .split(":")
          .map(x => x.trim())
  );
  let ret = "";

  ret += writeImports();

  ret += "\n";
  ret += `export default class ${name} extends ${STMT} {\n`;

  ret += writeMembers();

  ret += writeConstructor();

  ret += writeAcceptFunction();

  ret += "}\n";

  await fs.writeFile(`${DIR}/${name}.ts`, ret);

  function writeImports() {
    let tmp = "";
    tmp += `import ${STMT} from "./${STMT}.js";\n`;
    tmp += `import ${VISITOR} from "./${VISITOR}.js";\n`;
    if (parameter.includes(EXPR)) {
      tmp += 'import Expr from "../expr/Expr.js";\n';
    }
    if (parameter.includes("Token")) {
      tmp += 'import Token from "../scanner/Token.js";\n';
    }
    if (parameter.includes("Func")) {
      tmp += 'import Func from "../stmt/Func.js";\n';
    }
    if (parameter.includes("Variable")) {
      tmp += 'import Variable from "../expr/Variable.js";\n';
    }
    return tmp;
  }

  function writeMembers() {
    let tmp = "";
    for (const [pType, pName] of parameterList) {
      if (!pName) {
        continue;
      }
      tmp += `${PAD}${pName}: ${pType};\n`;
    }
    if (tmp) {
      tmp += "\n";
    }
    return tmp;
  }

  function writeConstructor() {
    let tmp = "";
    tmp += `${PAD}constructor(`;
    let isFirst = true;
    for (const [pType, pName] of parameterList) {
      if (!pName) {
        continue;
      }
      if (!isFirst) {
        tmp += ", ";
      }
      isFirst = false;
      tmp += `${pName}: ${pType}`;
    }
    tmp += ") {\n";

    tmp += `${PAD}${PAD}super();\n`;

    let members = "";
    for (const [pType, pName] of parameterList) {
      if (!pName) {
        continue;
      }
      members += `${PAD}${PAD}this.${pName} = ${pName};\n`;
    }
    if (members) {
      tmp += "\n" + members;
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
