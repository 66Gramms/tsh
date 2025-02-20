import { FakeStdout, FindProgram } from "./helpers";

export const Commands: Map<
  string,
  (args: string[], redirectTo?: string, appendMode?: boolean) => void
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

function echo(args: string[], redirectTo?: string, appendMode?: boolean) {
  FakeStdout(args.join(" "), redirectTo, appendMode);
}

function type(args: string[], redirectTo?: string, appendMode?: boolean) {
  if (Commands.has(args[0])) {
    FakeStdout(`${args[0]} is a shell builtin`, redirectTo, appendMode);
    return;
  }

  const programPath = FindProgram(args[0]);
  if (programPath) {
    FakeStdout(`${args[0]} is ${programPath}`);
  } else {
    FakeStdout(`${args[0]}: not found`);
  }
}

function exit(args: string[], redirectTo?: string, appendMode?: boolean) {
  const exitCode = parseInt(args[0]);
  if (isNaN(exitCode)) {
    process.exit(0);
  }
  process.exit(exitCode);
}

function pwd(args: string[], redirectTo?: string, appendMode?: boolean) {
  FakeStdout(process.cwd(), redirectTo, appendMode);
}

function cd(args: string[], redirectTo?: string, appendMode?: boolean) {
  args[0] = args[0].replace("~", process.env.HOME || "");
  try {
    process.chdir(args[0]);
  } catch (err) {
    FakeStdout(
      `cd: ${args[0]}: No such file or directory`,
      redirectTo,
      appendMode
    );
  }
}
