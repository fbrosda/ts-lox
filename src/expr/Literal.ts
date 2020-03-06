import Expression from "./Expression.js";

export default class Literal extends Expression {
  value: string | number | boolean | null;

  constructor(value: string | number | boolean | null) {
    super();

    this.value = value;
  }
}
