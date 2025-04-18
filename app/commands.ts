import { HISTORY_FILE } from "./consts";
import { GLOBAL_STATE } from "./global-state";
import { WriteOutput, FindProgram } from "./helpers";
import { Redirection } from "./types";
import fs from "fs";

export const Commands: Map<
  string,
  (args: string[], outputRedirection?: Redirection) => string
> = new Map();

export function RegisterBuiltInCommands() {
  Commands.set(BuiltInCommands.echo, echo);
  Commands.set(BuiltInCommands.type, type);
  Commands.set(BuiltInCommands.exit, exit);
  Commands.set(BuiltInCommands.pwd, pwd);
  Commands.set(BuiltInCommands.cd, cd);
}

enum BuiltInCommands {
  echo = "echo",
  type = "type",
  exit = "exit",
  pwd = "pwd",
  cd = "cd",
}

function echo(args: string[], outputRedirection?: Redirection): string {
  return WriteOutput(args.join(" "), outputRedirection);
}

function type(args: string[], outputRedirection?: Redirection): string {
  if (!args.length) {
    return "";
  }

  if (Commands.has(args[0])) {
    return WriteOutput(`${args[0]} is a shell builtin`, outputRedirection);
  }

  const programPath = FindProgram(args[0]);
  if (programPath) {
    return WriteOutput(`${args[0]} is ${programPath}`, outputRedirection);
  } else {
    return WriteOutput(`${args[0]}: not found`, outputRedirection);
  }
}

function exit(args: string[], outputRedirection?: Redirection): string {
  const exitCode = parseInt(args[0]);
  if (isNaN(exitCode)) {
    fs.writeFileSync(HISTORY_FILE, GLOBAL_STATE.history.reverse().join("\n"));
    process.exit(0);
  }
  fs.writeFileSync(HISTORY_FILE, GLOBAL_STATE.history.reverse().join("\n"));
  process.exit(exitCode);
}

function pwd(args: string[], outputRedirection?: Redirection): string {
  return WriteOutput(process.cwd(), outputRedirection);
}

function cd(args: string[], outputRedirection?: Redirection): string {
  if (!args.length) {
    args[0] = process.env.HOME || "";
    if (!args[0]) {
      return "";
    }
  }
  args[0] = args[0].replace("~", process.env.HOME || "");
  try {
    process.chdir(args[0]);
  } catch (err) {
    return WriteOutput(
      `cd: ${args[0]}: No such file or directory`,
      outputRedirection
    );
  }

  return "";
}
