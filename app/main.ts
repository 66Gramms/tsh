import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

// Uncomment this block to pass the first stage
rl.prompt();

rl.on("line", (input) => {
  console.log(`${input}: command not found`);
  rl.prompt();
});
