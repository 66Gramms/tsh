export type Operator = {
  op: string;
};

export interface Redirection {
  outputFile?: string;
  appendMode?: boolean;
  fileDescriptor?: number;
  pipe?: boolean;
  output?: string;
}

export interface Command {
  filteredArgs: string[];
  input: string;
  redirection: Redirection;
}
