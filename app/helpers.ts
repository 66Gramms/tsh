import { spawn } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import * as fs from "fs";
import { Operator, Redirection } from "./types";
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
  inputFile: string,
  redirection: Redirection
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const programPath = FindProgram(command);
    if (!programPath) {
      return resolve(false);
    }

    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"], // Allow piping
    });

    if (inputFile) {
      const inputData = require("fs").readFileSync(inputFile);
      child.stdin.write(inputData);
      child.stdin.end();
    }

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (data) => {
      stdoutData += data.toString();
      if (redirection.fileDescriptor !== 1) {
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
      resolve(true);
    });

    child.on("error", (err) => {
      process.stderr.write(`Error running ${command}: ${err}`);
      reject(err);
    });
  });
}

export function PreprocessArgs(input: string): {
  command: string;
  preprocessedArgs: (string | { op: string })[];
} {
  var parse = require("shell-quote/parse");
  var preprocessedArgs: [string | { op: string }] = parse(input);

  const command = preprocessedArgs[0] as string;
  preprocessedArgs.shift();
  return { command, preprocessedArgs };
}

export const ProcessArgs = (
  args: (string | Operator)[]
): { filteredArgs: string[]; inputFile: string; redirection: Redirection } => {
  let inputFile = "";
  let redirection: Redirection = {
    outputFile: "",
    appendMode: false,
    fileDescriptor: -1,
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
      } else {
        redirection.fileDescriptor = 1;
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

  return { filteredArgs, inputFile, redirection };
};

export function FakeStdout(
  input: string,
  outputRedirection?: Redirection
): void {
  if (
    outputRedirection?.fileDescriptor !== 1 ||
    !outputRedirection ||
    !outputRedirection.outputFile
  ) {
    process.stdout.write(input);
  }

  if (outputRedirection?.fileDescriptor === 1 && outputRedirection.outputFile) {
    fs.writeFileSync(outputRedirection.outputFile, input + "\n", {
      flag: outputRedirection.appendMode ? "a" : "w",
    });
  }
  if (
    outputRedirection?.fileDescriptor !== 1 &&
    outputRedirection?.outputFile
  ) {
    fs.closeSync(fs.openSync(outputRedirection?.outputFile ?? "", "w"));
  }
}

export function LoadInitialHistory(): string[] {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  return fs.readFileSync(HISTORY_FILE, "utf-8").split("\n").reverse();
}
