import { createInterface } from "readline";
import { Commands, RegisterBuiltInCommands } from "./commands";
import { PreprocessArgs, ProcessArgs, RunProgramIfExists } from "./helpers";

RegisterBuiltInCommands();

function handleCompletion(line: string) {
  const matches = Array.from(Commands.keys())
    .filter((command) => command.startsWith(line))
    .map((input) => `${input} `);
  return [matches, line];
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: handleCompletion,
});

rl.prompt();

rl.on("line", (input) => {
  const { command, preprocessedArgs } = PreprocessArgs(input);
  let commandToRun = Commands.get(command);

  const { filteredArgs, inputFile, redirection } =
    ProcessArgs(preprocessedArgs);

  if (commandToRun) {
    commandToRun(filteredArgs, redirection);
  } else {
    const result = RunProgramIfExists(
      command,
      filteredArgs,
      inputFile,
      redirection
    );
    if (!result) {
      process.stdout.write(`${command}: command not found\n`);
    }
  }
  rl.prompt();
});
