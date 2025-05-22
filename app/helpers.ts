import { existsSync, statSync } from "fs";
import { join } from "path";
import * as fs from "fs";
import { HISTORY_FILE, PATH_SEPARATOR } from "./consts";
import { Command } from "./commands";
import { Executable } from "./commands/Executable";
import { Operation } from "./types";
import { Builtin } from "./commands/Builtin";

export function GetExecutablePath(command: string): string | null {
  const paths = (process.env.PATH || "").split(PATH_SEPARATOR);
  for (const dir of paths) {
    const fullPath = join(dir, command);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  return null;
}

export function PreprocessArgs(input: string): (string | { op: string })[] {
  var parse = require("shell-quote/parse");
  var preprocessedArgs: [string | { op: string }] = parse(input);
  return preprocessedArgs;
}

function isOpObject(item: string | { op: string }): item is { op: string } {
  return typeof item !== "string";
}

function findAndCreateCommand(commandName: string): Command {
  if (Builtin.builtins.has(commandName)) {
    return new Builtin(commandName);
  } else {
    return new Executable(commandName);
  }
}

export function ProcessArgs(input: (string | { op: string })[]): Command[] {
  let currentCommand: Command | undefined = undefined;
  let commands: Command[] = [];
  let currentArgs: string[] = [];
  for (let i = 0; i < input.length; i++) {
    const item = input[i];

    if (typeof item === "string") {
      currentArgs.push(item as string);
    } else if (isOpObject(item)) {
      currentCommand = findAndCreateCommand(currentArgs[0]);

      switch (item.op) {
        case Operation.Pipe:
          currentCommand.operationMode = Operation.Pipe;
          currentCommand.args = currentArgs.slice(1);
          commands.push(currentCommand);
          currentCommand = undefined;
          currentArgs = [];
          break;
        case Operation.Append:
          currentCommand.operationMode = Operation.Append;
          currentCommand.redirectFilePath = input[i + 1] as string;
          i++;
          break;
        case Operation.Redirect:
          currentCommand.operationMode = Operation.Redirect;
          currentCommand.redirectFilePath = input[i + 1] as string;
          i++;
          break;
        case Operation.RedirectInput:
          currentCommand.operationMode = Operation.RedirectInput;
          currentCommand.redirectFilePath = input[i + 1] as string;
          i++;
          break;
        default:
          currentCommand.args.push(item.op);
          break;
      }
    }
  }

  if (currentCommand) {
    commands.push(currentCommand);
    return commands;
  }

  if (currentArgs.length) {
    let command = findAndCreateCommand(currentArgs[0]);
    command.args = currentArgs.slice(1);
    commands.push(command);
  }

  return commands;
}

export function LoadInitialHistory(): string[] {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  return fs.readFileSync(HISTORY_FILE, "utf-8").split("\n").reverse();
}
