import fs from "fs";
import path from "path";

const dbFile = path.join("./database", "grup.json");
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify([]));

let handler = async (m, { text, conn }) => {
    if (!text && !m.isGroup) return m.reply("Gunakan: .addidgc <id grup atau link invite>");

    let idGrup;

    if (text) {
        // Jika user memasukkan link invite
        if (/https?:\/\/chat\.whatsapp\.com\/\w+/i.test(text)) {
            try {
                const res = await conn.groupAcceptInvite(text.split("/").pop());
                idGrup = res;
            } catch (e) {
                return m.reply("Gagal join grup dari link. Pastikan link benar.");
            }
        } else {
            // Anggap user memasukkan langsung ID grup
            idGrup = text;
        }
    } else if (m.isGroup) {
        idGrup = m.chat;
    }

    if (!idGrup) return m.reply("ID grup tidak valid.");

    let grupList = JSON.parse(fs.readFileSync(dbFile));
    if (grupList.includes(idGrup)) return m.reply("Grup ini sudah terdaftar untuk auto promosi.");

    grupList.push(idGrup);
    fs.writeFileSync(dbFile, JSON.stringify(grupList, null, 2));
    await m.reply(`✅ Grup berhasil ditambahkan untuk auto promosi!\nID: ${idGrup}`);
};

handler.help = ["addidgc"];
handler.tags = ["owner"];
handler.command = /^addidgc$/i;
handler.owner = true;

export default handler;