import Callable from "./Callable";
import ClassInstance from "./ClassInstance";

type LiteralValue = ClassInstance | Callable | string | number | boolean | null;

export default LiteralValue;
