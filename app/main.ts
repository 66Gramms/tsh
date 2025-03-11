import { createInterface } from "readline";
import { Commands, RegisterBuiltInCommands } from "./commands";
import { PreprocessArgs, ProcessArgs, RunProgramIfExists } from "./helpers";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: handleCompletion,
});

function handleCompletion(line: string) {
  const matches = Array.from(Commands.keys())
    .filter((command) => command.startsWith(line))
    .map((input) => `${input} `);

  if (!matches.length) {
    process.stdout.write("\u0007"); //Ring bell
  }
  return [matches, line];
}

RegisterBuiltInCommands();
rl.prompt();
rl.on("line", async (input) => {
  const { command, preprocessedArgs } = PreprocessArgs(input);
  let commandToRun = Commands.get(command);

  const { filteredArgs, inputFile, redirection } =
    ProcessArgs(preprocessedArgs);

  if (commandToRun) {
    commandToRun(filteredArgs, redirection);
  } else {
    const result = await RunProgramIfExists(
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
