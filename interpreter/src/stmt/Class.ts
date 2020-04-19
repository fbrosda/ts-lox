import Stmt from "./Stmt.js";
import Visitor from "./Visitor.js";
import Token from "../scanner/Token.js";
import Func from "../stmt/Func.js";
import Variable from "../expr/Variable.js";

export default class Class extends Stmt {
  name: Token;
  superclass: Variable | null;
  methods: Func[];

  constructor(name: Token, superclass: Variable | null, methods: Func[]) {
    super();

    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitClass(this);
  }
}
