import { BuiltinFunction, Command, OnStreamFunction } from ".";
import { Operation } from "../types";
import { cd, echo, exit, pwd, type } from "./bultins";

export class Builtin implements Command {
  standardStreams: string[] = ["", "", ""];
  operationMode: Operation = Operation.Default;
  redirectFilePath: string = "";
  args: string[] = [];

  private name: string = "";
  private builtinFn: BuiltinFunction | undefined;
  private appendStream: OnStreamFunction = (
    text: string,
    streamIndex: number = 1
  ) => {
    this.standardStreams[streamIndex] += text + "\n";
  };

  static builtins: Map<string, BuiltinFunction> = new Map([
    ["echo", echo],
    ["type", type],
    ["exit", exit],
    ["pwd", pwd],
    ["cd", cd],
  ]);

  constructor(name: string, args: string[] = []) {
    this.args = args;
    this.name = name;
    this.builtinFn = Builtin.builtins.get(name);
  }

  execute = async (): Promise<number> => {
    if (!this.builtinFn) {
      throw new Error(`Command ${this.name} not found`);
    }
    return Promise.resolve(this.builtinFn(this.args, this.appendStream));
  };
}
