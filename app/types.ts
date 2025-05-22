export type Operator = {
  op: string;
};

export enum Operation {
  Default = "",
  Pipe = "|",
  Redirect = ">",
  Append = ">>",
  RedirectInput = "<",
}
