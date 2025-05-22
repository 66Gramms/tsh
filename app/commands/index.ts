import { Operation } from "../types";

export interface OnStreamFunction {
  (text: string, streamIndex?: number): void;
}

export interface BuiltinFunction {
  (args: string[], onStream: OnStreamFunction): number;
}

export interface Command {
  standardStreams: string[];
  operationMode: Operation;
  redirectFilePath: string;
  args: string[];
  execute: () => Promise<number>;
}
