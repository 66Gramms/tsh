import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";

export function FindProgram(command: string): string | null {
  const paths = (process.env.PATH || "").split(":");
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
    execSync(`${command} ${args.join(" ")}`, { stdio: "inherit" });
    return true;
  }
  return false;
}
