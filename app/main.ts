import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

// Uncomment this block to pass the first stage
rl.prompt();

rl.on("line", (input) => {
  if (input.startsWith("exit")) {
    rl.close();
    process.exit(0);
  } else if (input.startsWith("echo ")) {
    console.log(input.slice(5));
  } else {
    console.log(`${input}: command not found`);
  }

  rl.prompt();
});
