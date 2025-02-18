import { createInterface } from "readline";
import { Commands, RegisterBuiltInCommands } from "./commands";
import { PreprocessArgs, RunProgramIfExists } from "./helpers";

RegisterBuiltInCommands();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

rl.prompt();

rl.on("line", (input) => {
  const args = PreprocessArgs(input);
  const command = args[0];
  args.shift();

  const commandToRun = Commands.get(command);
  if (commandToRun) {
    commandToRun(args);
  } else if (!RunProgramIfExists(command, args)) {
    console.log(`${command}: command not found`);
  }

  rl.prompt();
});
