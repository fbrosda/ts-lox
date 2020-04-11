import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";
import Func from "../stmt/Func.js";

export default class Class extends Stmt {
  name: Token;
  methods: Func[];

  constructor(name: Token, methods: Func[]) {
    super();

    this.name = name;
    this.methods = methods;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitClass(this);
  }
}
