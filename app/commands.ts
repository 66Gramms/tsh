import { FindProgram } from "./helpers";

export const Commands: Map<string, (args: string[]) => void> = new Map();

export function RegisterBuiltInCommands() {
  Commands.set(BuiltInCommands.echo, echo);
  Commands.set(BuiltInCommands.type, type);
  Commands.set(BuiltInCommands.exit, exit);
  Commands.set(BuiltInCommands.pwd, pwd);
}

enum BuiltInCommands {
  echo = "echo",
  type = "type",
  exit = "exit",
  pwd = "pwd",
}

function echo(args: string[]) {
  console.log(args.join(" "));
}

function type(args: string[]) {
  if (Commands.has(args[0])) {
    console.log(`${args[0]} is a shell builtin`);
    return;
  }

  const programPath = FindProgram(args[0]);
  if (programPath) {
    console.log(`${args[0]} is ${programPath}`);
  } else {
    console.log(`${args[0]}: not found`);
  }
}

function exit(args: string[]) {
  const exitCode = parseInt(args[0]);
  if (isNaN(exitCode)) {
    process.exit(0);
  }
  process.exit(exitCode);
}

function pwd() {
  console.log(process.cwd());
}
