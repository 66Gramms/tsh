import { createInterface } from "readline";
import { PreprocessArgs, ProcessArgs } from "./helpers";
import fs from "fs";
import { HISTORY_FILE, PATH_SEPARATOR } from "./consts";
import { GLOBAL_STATE } from "./global-state";
import { Builtin } from "./commands/Builtin";
import { Operation } from "./types";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: handleCompletion,
  history: GLOBAL_STATE.history,
  historySize: 10,
});

function handleCompletion(line: string) {
  const matches = Array.from(Builtin.builtins.keys())
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

  if (
    line !== GLOBAL_STATE.previousLine &&
    [...matches, ...executables].length > 1
  ) {
    process.stdout.write("\u0007"); // Ring bell on first match
    GLOBAL_STATE.previousLine = line;
    return [[], line];
  }

  return [[...matches, ...executables], line];
}

let previousHistoryLength = GLOBAL_STATE.history.length;
rl.on("history", (history) => {
  if (history.length === previousHistoryLength) {
    return;
  }

  GLOBAL_STATE.history = history;
  previousHistoryLength = history.length;
});

rl.on("close", () => {
  fs.writeFileSync(HISTORY_FILE, GLOBAL_STATE.history.reverse().join("\n"));
  process.exit(0);
});

rl.prompt();
rl.on("line", async (input: string) => {
  const processedCommands = ProcessArgs(PreprocessArgs(input));

  for (let i = 0; i < processedCommands.length; i++) {
    let command = processedCommands[i];
    try {
      await command.execute();
    } catch (err) {
      if (err instanceof Error) {
        process.stdout.write(err.message + "\n");
      } else {
        process.stdout.write(String(err) + "\n");
      }
      break;
    }

    switch (command.operationMode) {
      case Operation.Default:
        if (command.standardStreams[1].length)
          process.stdout.write(command.standardStreams[1]);
        if (command.standardStreams[2].length)
          process.stderr.write(command.standardStreams[2]);
        break;
      case Operation.Pipe:
        let nextCommand = processedCommands[i + 1];
        nextCommand.standardStreams[0] = command.standardStreams[1];
        break;
      case Operation.Redirect:
        fs.writeFileSync(command.redirectFilePath, command.standardStreams[1]);
        break;
      case Operation.Append:
        fs.appendFileSync(
          command.redirectFilePath,
          command.standardStreams[1],
          "utf-8"
        );
      case Operation.RedirectInput:
        const fileContent = fs.readFileSync(command.redirectFilePath, "utf-8");
        command.standardStreams[0] = fileContent;
        break;
    }
  }

  rl.prompt();
});
