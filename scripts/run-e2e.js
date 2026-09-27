const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const PORT = process.env.CYPRESS_BASE_PORT || "3456";
const BASE_URL = `http://127.0.0.1:${PORT}`;
const isOpen = process.argv.includes("--open");
const root = path.join(__dirname, "..");

function startServer() {
  const httpServerBin = require.resolve("http-server/bin/http-server");
  return spawn(
    process.execPath,
    [httpServerBin, "frontend", "-p", PORT, "-a", "127.0.0.1", "-c-1"],
    { stdio: "inherit", cwd: root }
  );
}

function waitForServer(url, timeoutMs = 20000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const ping = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) {
            resolve();
            return;
          }
          retry();
        })
        .on("error", retry);
    };

    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(ping, 250);
    };

    ping();
  });
}

function stopServer(server) {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      }).on("close", resolve);
      return;
    }

    server.kill("SIGTERM");
    resolve();
  });
}

async function main() {
  const server = startServer();

  try {
    await waitForServer(`${BASE_URL}/login.html`);

    const cypressBin = require.resolve("cypress/bin/cypress");
    const cypress = spawn(
      process.execPath,
      [cypressBin, isOpen ? "open" : "run"],
      {
        stdio: "inherit",
        cwd: root,
        env: {
          ...process.env,
          CYPRESS_BASE_URL: BASE_URL,
        },
      }
    );

    const code = await new Promise((resolve) => {
      cypress.on("exit", (exitCode) => resolve(exitCode ?? 1));
    });

    await stopServer(server);
    process.exit(code);
  } catch (error) {
    await stopServer(server);
    console.error(error.message);
    process.exit(1);
  }
}

main();
