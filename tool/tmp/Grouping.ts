import Expression from "./Expression.js;"

export default class Grouping extends Expression {
  expression: Expression;

  constructor(expression: Expression) {
    super();

    this.expression = expression;
  }
}
