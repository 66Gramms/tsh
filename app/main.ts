import { createInterface } from "readline";

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
  let binPath = "";
  paths.find((path) => {
    if (path.split("/").includes(input.slice(5))) {
      binPath = path;
      return true;
    }
  });
  if (binPath) {
    console.log(`${input.slice(5)} is ${binPath}`);
  } else {
    console.log(`${input.slice(5)}: not found`);
  }
};

const pathEnv = process.env.PATH;
const paths = pathEnv?.split(":") || [];

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
