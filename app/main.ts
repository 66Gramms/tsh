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

const exit = () => {
  rl.close();
  process.exit(0);
};

const echo = (input: string) => {
  console.log(input.slice(5));
};

const type = (input: string) => {
  const command = input.slice(5);

  // Check if command is a shell builtin
  if (builtIns[command as keyof typeof builtIns]) {
    console.log(`${command} is a shell builtin`);
    return;
  }

  // Search for the command in each directory in PATH
  for (const dir of paths) {
    const fullPath = join(dir, command);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      console.log(`${command} is ${fullPath}`);
      return;
    }
  }

  console.log(`${command}: not found`);
};

const pathEnv = process.env.PATH || "";
const paths = pathEnv.split(":");

rl.prompt();

rl.on("line", (input) => {
  if (input.startsWith(builtIns.exit)) {
    exit();
  } else if (input.startsWith(builtIns.echo)) {
    echo(input.slice(5));
  } else if (input.startsWith(builtIns.type)) {
    type(input);
  } else {
    console.log(`${input}: command not found`);
  }

  rl.prompt();
});
