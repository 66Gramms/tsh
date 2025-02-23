import { spawnSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import * as fs from "fs";
import { Redirection } from "./types";

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

export function PreprocessArgs(input: string): [string | { op: string }] {
  var parse = require("shell-quote/parse");
  var processedArgs: [string | { op: string }] = parse(input);

  return processedArgs;
}

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
