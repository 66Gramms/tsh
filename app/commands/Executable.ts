import { spawn } from "child_process";
import { Command } from ".";
import { GetExecutablePath } from "../helpers";
import { Operation } from "../types";

export class Executable implements Command {
  standardStreams: string[] = ["", "", ""];
  operationMode: Operation = Operation.Default;
  redirectFilePath: string = "";
  args: string[] = [];
  path: string;

  private name: string = "";

  constructor(name: string, args: string[] = []) {
    this.name = name;
    this.path = GetExecutablePath(name) || "";
    this.args = args;
  }

  execute = async (): Promise<number> => {
    if (!this.path.length) {
      throw new Error(`Command ${this.name} not found`);
    }

    return new Promise<number>((resolve, reject) => {
      const child = spawn(this.path!, this.args, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (this.standardStreams[0]?.length) {
        child.stdin.write(this.standardStreams[0]);
        child.stdin.end();
      }

      child.stdout.on("data", (data: string) => {
        this.standardStreams[1] += data.toString();
      });

      child.stderr.on("data", (data: string) => {
        this.standardStreams[2] += data.toString();
      });

      child.on("close", (code: number) => {
        resolve(code);
      });

      child.on("error", (err) => {
        reject(err);
      });
    });
  };
}
