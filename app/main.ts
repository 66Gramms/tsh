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

// Uncomment this block to pass the first stage
rl.prompt();

rl.on("line", (input) => {
  if (input.startsWith(builtIns.exit)) {
    rl.close();
    process.exit(0);
  } else if (input.startsWith(builtIns.echo)) {
    console.log(input.slice(5));
  } else if (input.startsWith(builtIns.type)) {
    if (input.slice(5) in builtIns) {
      console.log(`${input.slice(5)} is a shell built-in`);
    }
  } else {
    console.log(`${input}: command not found`);
  }

  rl.prompt();
});
