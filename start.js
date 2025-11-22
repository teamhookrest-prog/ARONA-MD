/* 
⚠ Warning! ⚠
Jangan di ganti cr ini bos
© danz-xyz
api free : hookrest.my.id
owner : 62895323195263 [ Danz ]
*/

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import chalk from "chalk";
import readline from "readline";
import { headerLog } from "./function/console.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let isRunning = false;
const startBot = async () => {
    if (isRunning) return;
    isRunning = true;
    const args = [path.join(__dirname, "main.js"), ...process.argv.slice(2)];
    const p = spawn(process.argv[0], args, {
        stdio: ["inherit", "inherit", "inherit", "ipc"]
    });

    p.on("exit", code => {
        console.log(`${chalk.white.bold(" [SISTEM]")} ${chalk.yellow.bold(`BERHENTI DENGAN KODE: ${code} ❌`)}`);
        isRunning = false;
    });

    p.on("error", err => {
        console.log(`${chalk.white.bold(" [SISTEM]")} ${chalk.red.bold(`BERHENTI KARENA ERROR! ❌`)}`);
        console.error(err);
        p.kill();
        isRunning = false;
    });
    await headerLog();
};

await startBot();
