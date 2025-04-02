import { spawn } from "child_process";

describe("Built-in commands' tests", () => {
  let replProcess: ReturnType<typeof spawn>;
  let exitCode: number | null = null;

  beforeEach(async () => {
    exitCode = null;

    replProcess = spawn("bun", ["run", "app/main.ts"]);

    if (!replProcess) {
      throw new Error("Failed to spawn Bun process");
    }

    replProcess.on("close", (code) => {
      exitCode = code;
    });

    // Wait for initial prompt/output from REPL
    await new Promise((resolve) => {
      replProcess.stdout!.once("data", resolve);
    });
  });

  afterEach(() => {
    if (!replProcess.killed) {
      replProcess.kill();
    }
  });

  const waitForOutput = (): Promise<string> => {
    return new Promise((resolve) => {
      replProcess.stdout!.once("data", (data: Buffer) => {
        resolve(data.toString());
      });
    });
  };

  test("should say command not found", async () => {
    replProcess.stdin!.write("kfisjegjdsg\n");
    const output = await waitForOutput();
    expect(output.split("\n")[0]).toEqual("kfisjegjdsg: command not found");
  });

  test("should say command not found twice", async () => {
    replProcess.stdin!.write("nonExistentCommand\n");
    const output1 = await waitForOutput();
    expect(output1.split("\n")[0]).toEqual(
      "nonExistentCommand: command not found"
    );

    replProcess.stdin!.write("nonExistentCommand2\n");
    const output2 = await waitForOutput();
    expect(output2.split("\n")[0]).toEqual(
      "nonExistentCommand2: command not found"
    );
  });
});
