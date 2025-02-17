import { spawnSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";

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

export function RunProgramIfExists(command: string, args: string[]): boolean {
  const programPath = FindProgram(command);
  if (programPath) {
    spawnSync(command, args, { stdio: "inherit" });
    return true;
  }
  return false;
}

export function PreprocessArgs(input: string): string[] {
  const processedArgs: string[] = [];
  const regexp = /'([^']*)'(?:'([^']*)')*/g;
  const matches = [...input.matchAll(regexp)];
  matches.forEach((match) => {
    processedArgs.push(match[0].replaceAll("'", ""));
    input = input.replace(match[0], "");
  });

  input.split(" ").forEach((arg) => {
    if (arg === "") {
      return;
    }
    if (arg.startsWith("~")) {
      arg = arg.replace("~", process.env.HOME || "~");
    }
    processedArgs.push(arg);
  });

  return processedArgs;
}
