import { FakeStdout, FindProgram } from "./helpers";
import { Redirection } from "./types";

export const Commands: Map<
  string,
  (args: string[], outputRedirection?: Redirection) => void
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

function echo(args: string[], outputRedirection?: Redirection) {
  FakeStdout(args.join(" "), outputRedirection);
}

function type(args: string[], outputRedirection?: Redirection) {
  if (Commands.has(args[0])) {
    FakeStdout(`${args[0]} is a shell builtin`, outputRedirection);
    return;
  }

  const programPath = FindProgram(args[0]);
  if (programPath) {
    FakeStdout(`${args[0]} is ${programPath}`, outputRedirection);
  } else {
    FakeStdout(`${args[0]}: not found`, outputRedirection);
  }
}

function exit(args: string[], outputRedirection?: Redirection) {
  const exitCode = parseInt(args[0]);
  if (isNaN(exitCode)) {
    process.exit(0);
  }
  process.exit(exitCode);
}

function pwd(args: string[], outputRedirection?: Redirection) {
  FakeStdout(process.cwd(), outputRedirection);
}

function cd(args: string[], outputRedirection?: Redirection) {
  args[0] = args[0].replace("~", process.env.HOME || "");
  try {
    process.chdir(args[0]);
  } catch (err) {
    FakeStdout(`cd: ${args[0]}: No such file or directory`, outputRedirection);
  }
}
