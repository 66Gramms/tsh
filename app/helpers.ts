import { spawn } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import * as fs from "fs";
import { Command, Operator, Redirection } from "./types";
import { HISTORY_FILE, PATH_SEPARATOR } from "./consts";

export function FindProgram(command: string): string | null {
  const paths = (process.env.PATH || "").split(PATH_SEPARATOR);
  for (const dir of paths) {
    const fullPath = join(dir, command);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  return null;
}

export function RunProgramIfExists(
  command: string,
  args: string[],
  input: string,
  redirection: Redirection
): Promise<string> {
  return new Promise((resolve, reject) => {
    const programPath = FindProgram(command);
    if (!programPath) {
      reject(true);
    }

    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"], // Allow piping
    });

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (data) => {
      stdoutData += data.toString();
      if (redirection.fileDescriptor !== 1 && !redirection.pipe) {
        process.stdout.write(data);
      }
    });

    child.stderr.on("data", (data) => {
      stderrData += data.toString();
      if (redirection.fileDescriptor !== 2) {
        process.stderr.write(data);
      }
    });

    child.on("close", (code) => {
      if (redirection.outputFile) {
        fs.writeFileSync(
          redirection.outputFile,
          redirection.fileDescriptor === 1 ? stdoutData : stderrData,
          {
            flag: redirection.appendMode ? "a" : "w",
          }
        );
      }
      if (redirection.pipe) {
        resolve(stdoutData);
      }
    });

    child.on("error", (err) => {
      process.stderr.write(`Error running ${command}: ${err}`);
      reject(err);
    });
  });
}

export function PreprocessArgs(input: string): (string | { op: string })[] {
  var parse = require("shell-quote/parse");
  var preprocessedArgs: [string | { op: string }] = parse(input);
  return preprocessedArgs;
}

export const ProcessArgs = (args: (string | Operator)[]): Command[] => {
  let processedCommands: Command[] = [];
  let currentCommand: Command = {
    filteredArgs: [],
    input: "",
    redirection: {
      outputFile: "",
      appendMode: false,
      fileDescriptor: -1,
    },
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const operator = (arg as Operator).op;

    if (operator) {
      const fileDescriptor = parseInt(args[i - 1] as string);
      if (!isNaN(fileDescriptor)) {
        currentCommand.redirection.fileDescriptor = fileDescriptor;
        currentCommand.filteredArgs.splice(
          currentCommand.filteredArgs.findIndex((arg) => arg === args[i - 1]),
          1
        );
      } else {
        currentCommand.redirection.fileDescriptor = 1;
      }
      switch (operator) {
        case ">":
          currentCommand.redirection.outputFile = args[i + 1] as string;
          i++;
          break;
        case ">>":
          currentCommand.redirection.outputFile = args[i + 1] as string;
          currentCommand.redirection.appendMode = true;
          i++;
          break;
        case "<":
          currentCommand.input = require("fs").readFileSync(
            args[i + 1] as string
          );
          i++;
          break;
        case "|":
          processedCommands.push(currentCommand);
          ProcessArgs(args.slice(i + 1)).forEach((cmd) => {
            processedCommands.push(cmd);
          });
        default:
          break;
      }
    } else {
      currentCommand.filteredArgs.push(arg as string);
    }
  }
  processedCommands.push(currentCommand);
  return processedCommands;
};

export function WriteOutput(
  input: string,
  outputRedirection?: Redirection
): string {
  if (
    (!outputRedirection ||
      !outputRedirection.outputFile ||
      outputRedirection?.fileDescriptor !== 1) &&
    !outputRedirection?.pipe
  ) {
    process.stdout.write(input + "\n");
    return "";
  }

  if (outputRedirection?.pipe) {
    return outputRedirection.output ?? "";
  }

  if (outputRedirection?.fileDescriptor === 1 && outputRedirection.outputFile) {
    fs.writeFileSync(outputRedirection.outputFile, input + "\n", {
      flag: outputRedirection.appendMode ? "a" : "w",
    });
  }
  return "";
}

export function LoadInitialHistory(): string[] {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  return fs.readFileSync(HISTORY_FILE, "utf-8").split("\n").reverse();
}
