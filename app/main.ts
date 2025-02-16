import { createInterface } from "readline";
import { Commands, RegisterBuiltInCommands } from "./commands";
import { RunProgramIfExists } from "./helpers";

RegisterBuiltInCommands();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

rl.prompt();

rl.on("line", (input) => {
  const command = input.split(" ")[0];
  const args = input.split(" ").slice(1);

  const commandToRun = Commands.get(command);
  if (commandToRun) {
    commandToRun(args);
  } else if (!RunProgramIfExists(command, args)) {
    console.log(`${command}: command not found`);
  }

  rl.prompt();
});
