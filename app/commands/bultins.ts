import { BuiltinFunction } from ".";
import { HISTORY_FILE } from "../consts";
import { GLOBAL_STATE } from "../global-state";
import { GetExecutablePath } from "../helpers";
import { Builtin } from "./Builtin";
import fs from "fs";

export const echo: BuiltinFunction = function (args, onStream) {
  onStream(args.join(" "));
  return 0;
};

export const type: BuiltinFunction = function (args, onStream) {
  if (!args.length) {
    return 0;
  }

  if (Builtin.builtins.has(args[0])) {
    onStream(`${args[0]} is a shell builtin`);
    return 0;
  }

  const programPath = GetExecutablePath(args[0]);
  if (programPath) {
    onStream(`${args[0]} is ${programPath}`);
  } else {
    onStream(`${args[0]} not found`);
  }
  return 0;
};

export const exit: BuiltinFunction = function (args, onStream) {
  const exitCode = parseInt(args[0]);
  if (isNaN(exitCode)) {
    fs.writeFileSync(HISTORY_FILE, GLOBAL_STATE.history.reverse().join("\n"));
    process.exit(0);
  }
  fs.writeFileSync(HISTORY_FILE, GLOBAL_STATE.history.reverse().join("\n"));
  process.exit(exitCode);
};

export const pwd: BuiltinFunction = function (args, onStream) {
  onStream(process.cwd());
  return 0;
};

export const cd: BuiltinFunction = function (args, onStream) {
  if (!args.length) {
    args[0] = process.env.HOME || "";
    if (!args[0]) {
      return 0;
    }
  }
  args[0] = args[0].replace("~", process.env.HOME || "");
  try {
    process.chdir(args[0]);
  } catch (err) {
    onStream(`cd: no such file or directory: ${args[0]}`);
    return 0;
  }

  return 0;
};
