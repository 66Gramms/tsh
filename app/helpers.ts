import { spawn, spawnSync, SpawnSyncReturns } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import * as fs from "fs";

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
  outputFile: string,
  appendMode: boolean
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
    if (outputFile) {
      fs.writeFileSync(outputFile, stdout, { flag: appendMode ? "a" : "w" });
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
  redirectTo?: string,
  appendMode?: boolean
): void {
  if (!redirectTo) {
    console.log(input);
    return;
  }

  fs.writeFileSync(redirectTo, input, {
    flag: appendMode ? "a" : "w",
  });
}
