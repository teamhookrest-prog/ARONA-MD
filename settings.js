/* 
⚠ Warning! ⚠
Jangan di ganti cr ini bos
© danz-xyz
api free : hookrest.my.id
owner : 62895323195263 [ Danz ]
*/

import chalk from "chalk";
import { watchFile, unwatchFile } from "fs";
import { fileURLToPath } from "url";
import moment from "moment-timezone";

// ————————————————————————————————
// ==== id ch ====
global.idch = ["120363422342453820@newsletter"];
// ===== CONFIG =====
global.owner = ["62895323195263"];

global.info = {
    nomorbot: "0",
    namabot: "αяσηα ωнαтѕαρρ вσт",
    nomorowner: "62895323195263",
    namaowner: "danz-xzy"
}

// ===== THUMBNAIL =====
global.thum = "https://pics-maiyizhi.oss-accelerate.aliyuncs.com/nx/7326ab916238.jpg";

// ==== audio ===
global.audio = "https://files.catbox.moe/y11bvq.opus";

// ===== OPTIONS =====
global.autoread = false; // OPSIONAL
global.stage = {
    wait: "*[ sʏsᴛᴇᴍ ] sᴇᴅᴀɴɢ ᴅɪᴘʀᴏsᴇs...*",
    error: "*[ ᴡᴀʀɴɪɴɢ ] ᴘʀᴏsᴇs ɢᴀɢᴀʟ!*"
}

// ===== LINK ====
global.lgh = "https://github.com/wirdan1"; // Github
global.lwa = "https://wa.me/62895323195263"; // Whatsapp
global.lig = ""; // Instagram
global.lgc = ""; // Group Chat Whatsapp
global.lch = ""; // Channels Whatsapp 
let file = fileURLToPath(import.meta.url);
watchFile(file, async () => {
    unwatchFile(file);
    console.log(`${chalk.white.bold(" [SISTEM]")} ${chalk.green.bold(`FILE DIUPDATE "settings.js"`)}`);
    import(`${file}?update=${Date.now()}`);
});
