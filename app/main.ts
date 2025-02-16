import { createInterface } from "readline";
import { existsSync, statSync } from "fs";
import { join } from "path";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

enum builtIns {
  echo = "echo",
  type = "type",
  exit = "exit",
}

const exit = (exitCode: number) => {
  rl.close();
  process.exit(exitCode);
};

const echo = (input: string) => {
  console.log(input);
};

const type = (input: string) => {
  if (input in builtIns) {
    console.log(`${input} is a shell builtin`);
    return;
  }

  for (const dir of paths) {
    const fullPath = join(dir, input);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      console.log(`${input} is ${fullPath}`);
      return;
    }
  }

  console.log(`${input}: not found`);
};

const pathEnv = process.env.PATH || "";
const paths = pathEnv.split(":");

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
  } else {
    console.log(`${input}: command not found`);
  }

  rl.prompt();
});
