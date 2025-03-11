import { spawnSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import * as fs from "fs";
import { Operator, Redirection } from "./types";

var pathSeparator = process.platform === "win32" ? ";" : ":";

export function FindProgram(command: string): string | null {
  const paths = (process.env.PATH || "").split(pathSeparator);
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
): boolean {
  const programPath = FindProgram(command);
  if (programPath) {
    let readFile: Buffer | null = null;
    if (inputFile) {
      readFile = fs.readFileSync(inputFile);
    }

    let childInput = readFile?.toString() ?? "";
    const child = spawnSync(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      input: childInput,
      timeout: undefined,
    });

    const { stdout, stderr } = child;
    if (redirection.outputFile) {
      fs.writeFileSync(
        redirection.outputFile,
        redirection.fileDescriptor === 1 ? stdout : stderr,
        {
          flag: redirection.appendMode ? "a" : "w",
        }
      );
      const errors = stderr.toString();
      if (errors && redirection.fileDescriptor !== 2)
        console.log(errors.trim());
      if (redirection.fileDescriptor !== 1 && stdout.toString().trim()) {
        console.log(stdout.toString().trim());
      }
    } else {
      console.log(stdout.toString().trim());
    }

    return true;
  }
  return false;
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
    console.log(input);
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
