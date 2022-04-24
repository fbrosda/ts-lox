import Visitor from "./Visitor.js";

export default abstract class Stmt {
  abstract accept<T>(visitor: Visitor<T>): T;
}
