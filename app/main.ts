import { createInterface } from "readline";
import { Commands, RegisterBuiltInCommands } from "./commands";
import { PreprocessArgs, RunProgramIfExists } from "./helpers";
import { Operator, Redirection } from "./types";

RegisterBuiltInCommands();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

rl.prompt();

rl.on("line", (input) => {
  const args = PreprocessArgs(input);
  const command = args[0] as string;
  args.shift();
  let commandToRun = Commands.get(command);

  let inputFile = "";
  let redirection: Redirection = {
    outputFile: "",
    appendMode: false,
    fileDescriptor: 1,
  };
  const filteredArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const operator = (arg as Operator).op;

    if (operator) {
      const fileDescriptor = parseInt(args[i - 1] as string);
      if (!isNaN(fileDescriptor)) {
        redirection.fileDescriptor = fileDescriptor;
        filteredArgs.splice(
          filteredArgs.findIndex((arg) => arg === args[i - 1]),
          1
        );
      }
      switch (operator) {
        case ">":
          redirection.outputFile = args[i + 1] as string;
          i++;
          break;
        case ">>":
          redirection.outputFile = args[i + 1] as string;
          redirection.appendMode = true;
          i++;
          break;
        case "<":
          inputFile = args[i + 1] as string;
          i++;
          break;
        default:
          break;
      }
    } else {
      filteredArgs.push(arg as string);
    }
  }

  // console.log("filteredArgs", filteredArgs);
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
      console.log(`${command}: command not found`);
    }
  }
  rl.prompt();
});
