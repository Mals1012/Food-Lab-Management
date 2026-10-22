const { spawn } = require("child_process");
const path = require("path");

console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("\x1b[36m%s\x1b[0m", "   STARTING FOOD LAB MANAGEMENT SYSTEM (MERN)    ");
console.log("\x1b[36m%s\x1b[0m", "=================================================\n");

const backendPath = path.join(__dirname, "Backend");
const frontendPath = path.join(__dirname, "frontend");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

// Spawn Backend process
const backend = spawn(npmCmd, ["start"], {
    cwd: backendPath,
    stdio: "pipe",
    shell: true
});

backend.stdout.on("data", (data) => {
    process.stdout.write(`\x1b[34m[Backend]\x1b[0m ${data}`);
});

backend.stderr.on("data", (data) => {
    process.stderr.write(`\x1b[31m[Backend Error]\x1b[0m ${data}`);
});

// Spawn Frontend process
const frontend = spawn(npmCmd, ["run", "dev"], {
    cwd: frontendPath,
    stdio: "pipe",
    shell: true
});

frontend.stdout.on("data", (data) => {
    process.stdout.write(`\x1b[32m[Frontend]\x1b[0m ${data}`);
});

frontend.stderr.on("data", (data) => {
    process.stderr.write(`\x1b[33m[Frontend Info]\x1b[0m ${data}`);
});

const cleanup = () => {
    console.log("\nShutting down FoodLab LIMS services...");
    try {
        backend.kill();
        frontend.kill();
    } catch (e) {}
    process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
