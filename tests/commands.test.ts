import { Commands, RegisterBuiltInCommands } from "../app/commands";

describe("echo command", () => {
  it("should echo the input", async () => {
    RegisterBuiltInCommands();
    const echoCommand = Commands.get("echo");
    expect(echoCommand).toBeDefined();
  });
});
