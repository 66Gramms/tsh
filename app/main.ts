import { createInterface } from "readline";
import { Commands, RegisterBuiltInCommands } from "./commands";
import {
  LoadInitialHistory,
  PreprocessArgs,
  ProcessArgs,
  RunProgramIfExists,
} from "./helpers";
import fs from "fs";
import { HISTORY_FILE, PATH_SEPARATOR } from "./consts";

const initialHistory = LoadInitialHistory();
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: handleCompletion,
  history: initialHistory,
  historySize: 10,
});

let previousLine = "";
function handleCompletion(line: string) {
  const matches = Array.from(Commands.keys())
    .filter((command) => command.startsWith(line))
    .map((input) => `${input} `);

  const executables: string[] = [];
  for (const dir of (process.env.PATH || "").split(PATH_SEPARATOR)) {
    try {
      const files = fs.readdirSync(dir);
      executables.push(
        ...files
          .filter((file) => file.startsWith(line))
          .map((input) => `${input} `)
      );
    } catch (err) {
      // Ignore errors (e.g., if a path does not exist)
    }
  }

  if (!matches.length && !executables.length) {
    process.stdout.write("\u0007"); // Ring bell if no matches
    return [[], line];
  }

  if (line !== previousLine && [...matches, ...executables].length > 1) {
    process.stdout.write("\u0007"); // Ring bell on first match
    previousLine = line;
    return [[], line];
  }

  return [[...matches, ...executables], line];
}

let previousHistoryLength = initialHistory.length;
let historyState = initialHistory;
rl.on("history", (history) => {
  if (history.length === previousHistoryLength) {
    return;
  }

  historyState = history;
  previousHistoryLength = history.length;
});

rl.on("close", () => {
  fs.writeFileSync(HISTORY_FILE, historyState.reverse().join("\n"));
  process.exit(0);
});

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
