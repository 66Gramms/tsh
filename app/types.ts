export type Operator = {
  op: string;
};

export interface Redirection {
  outputFile: string;
  appendMode: boolean;
  fileDescriptor: number;
}
