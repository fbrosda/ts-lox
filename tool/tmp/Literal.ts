import Expression from "./Expression.js;"

export default class Literal extends Expression {
  value: Object;

  constructor(value: Object) {
    super();

    this.value = value;
  }
}
