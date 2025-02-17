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
  const command = input.split(" ")[0];
  const args = input.split(" ").slice(1).join(" ");

  const processedArgs = PreprocessArgs(args);
  const commandToRun = Commands.get(command);
  if (commandToRun) {
    commandToRun(processedArgs);
  } else if (!RunProgramIfExists(command, processedArgs)) {
    console.log(`${command}: command not found`);
  }

  rl.prompt();
});
