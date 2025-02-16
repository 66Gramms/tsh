import { createInterface } from "readline";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

enum builtIns {
  echo = "echo",
  type = "type",
  exit = "exit",
  pwd = "pwd",
}

const echo = (input: string) => {
  console.log(input);
};

const type = (input: string) => {
  if (input in builtIns) {
    console.log(`${input} is a shell builtin`);
    return;
  }

  const programPath = findProgram(input);
  if (programPath) {
    console.log(`${input} is ${programPath}`);
  } else {
    console.log(`${input}: not found`);
  }
};

const exit = (exitCode: number) => {
  rl.close();
  process.exit(exitCode);
};

const pwd = () => {
  console.log(process.cwd());
};

const findProgram = (command: string): string | null => {
  const paths = (process.env.PATH || "").split(":");
  for (const dir of paths) {
    const fullPath = join(dir, command);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  return null;
};

const runProgramIfExists = (command: string, args: string[]): boolean => {
  const programPath = findProgram(command);
  if (programPath) {
    execSync(`${command} ${args.join(" ")}`, { stdio: "inherit" });
    return true;
  }
  return false;
};

rl.prompt();

rl.on("line", (input) => {
  const command = input.split(" ")[0];
  const args = input.split(" ").slice(1);

  if (command === builtIns.exit) {
    exit(args[0] ? parseInt(args[0]) : 0);
  } else if (command === builtIns.echo) {
    echo(args.join(" "));
  } else if (command === builtIns.type) {
    type(args[0]);
  } else if (command === builtIns.pwd) {
    pwd();
  } else if (!runProgramIfExists(command, args)) {
    console.log(`${command}: command not found`);
  }

  rl.prompt();
});
