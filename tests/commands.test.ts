import { spawn } from "child_process";
import os from "os";
import path from "path";

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

  const waitForExit = () =>
    new Promise((resolve) => replProcess.once("close", resolve));

  test("command not found", async () => {
    replProcess.stdin!.write("kfisjegjdsg\n");
    const output = await waitForOutput();
    expect(output.split("\n")[0]).toEqual("kfisjegjdsg: command not found");
  });

  test("command not found twice", async () => {
    replProcess.stdin!.write("nonExistentCommand\n");
    let output = await waitForOutput();
    expect(output.split("\n")[0]).toEqual(
      "nonExistentCommand: command not found"
    );

    replProcess.stdin!.write("nonExistentCommand2\n");
    output = await waitForOutput();
    expect(output.split("\n")[0]).toEqual(
      "nonExistentCommand2: command not found"
    );
  });

  test("echo command", async () => {
    replProcess.stdin!.write("echo hello world\n");
    let output = await waitForOutput();
    expect(output.split("\n")[0]).toEqual("hello world");

    replProcess.stdin!.write("echo a              a\n");
    output = await waitForOutput();
    expect(output.split("\n")[0]).toEqual("a a");

    replProcess.stdin!.write('echo "hello   kitty"\n');
    output = await waitForOutput();
    expect(output.split("\n")[0]).toEqual("hello   kitty");
  });

  test("type command", async () => {
    replProcess.stdin!.write("type echo\n");
    let output = await waitForOutput();
    expect(output.split("\n")[0]).toBe("echo is a shell builtin");

    replProcess.stdin!.write("type ls\n");
    output = await waitForOutput();
    expect(output.split("\n")[0]).toMatch(/ls is .+/);

    replProcess.stdin!.write("type nonExistentCommand\n");
    output = await waitForOutput();
    expect(output.split("\n")[0]).toBe("nonExistentCommand: not found");

    replProcess.stdin!.write("type\n");
    output = await waitForOutput();
    expect(output.split("\n")[0]).toBe("$ ");
  });

  test("exit command", async () => {
    replProcess.stdin!.write("exit\n");
    await waitForExit();
    expect(exitCode).toBe(0);

    const replWithCode = spawn("bun", ["run", "app/main.ts"]);
    const exitPromise = new Promise((resolve) =>
      replWithCode.once("close", resolve)
    );
    replWithCode.stdin!.write("exit 42\n");
    await exitPromise;
    expect(replWithCode.exitCode).toBe(42);
  });

  test("pwd command", async () => {
    const cwd = process.cwd();
    replProcess.stdin!.write("pwd\n");
    const output = await waitForOutput();
    expect(output.split("\n")[0]).toBe(cwd);
  });

  test("cd command", async () => {
    const homeDir = os.homedir();
    const parentDir = path.resolve(homeDir, "..");

    replProcess.stdin!.write("cd\n");
    await waitForOutput();
    replProcess.stdin!.write("pwd\n");
    let output = await waitForOutput();
    expect(output.split("\n")[0]).toBe(homeDir);

    replProcess.stdin!.write(`cd ..\n`);
    await waitForOutput();
    replProcess.stdin!.write("pwd\n");
    output = await waitForOutput();
    expect(output.split("\n")[0]).toBe(parentDir);

    replProcess.stdin!.write("cd nonExistentDir\n");
    output = await waitForOutput();
    expect(output.split("\n")[0]).toMatch(/cd: .* No such file or directory/);
  });
});
