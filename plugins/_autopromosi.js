import moment from "moment-timezone";
import fs from "fs";
import path from "path";

const dbFile = path.join("./database", "grup.json");
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify([]));

let autopromo = {};
const jadwalPromo = ["09:00", "12:00", "15:00", "18:00", "21:00"];

let handler = async m => m;
handler.disabled = false;

setInterval(async () => {
    if (handler.disabled) return;
    if (!global.conn) return;

    const conn = global.conn;
    const timeNow = moment().tz("Asia/Jakarta").format("HH:mm");

    if (!jadwalPromo.includes(timeNow)) return;

    const grupList = JSON.parse(fs.readFileSync(dbFile));

    const caption = `
══════════════════
*ʀᴇᴋᴏᴍᴇɴᴅᴀsɪ ᴡᴇʙsɪᴛᴇ H2H*
──────────────────
> ᴡᴇʙsɪᴛᴇ: https://khafatopup.my.id
> ᴄᴏᴄᴏᴋ ʙᴀɢɪ ᴘᴇᴍᴜʟᴀ ᴅᴀɴ ᴘʀᴏғᴇsɪᴏɴᴀʟ
| sᴇʀᴠᴇʀ ᴜᴘᴅᴀᴛᴇ ʀᴜᴛɪɴ
══════════════════
`;

    for (const id of grupList) {
        autopromo[id] = autopromo[id] || [];

        if (autopromo[id].includes(timeNow)) continue;

        try {
            await conn.sendMessage(id, {
                image: { url: "https://files.catbox.moe/wehbcp.webp" },
                caption,
                footer: "Powered by Bot"
            });

            autopromo[id].push(timeNow);

            setTimeout(() => {
                autopromo[id] = autopromo[id].filter(t => t !== timeNow);
            }, 60000);

        } catch (e) {
            console.error("Gagal mengirim promo ke", id, e);
        }
    }
}, 30000);

export default handler;