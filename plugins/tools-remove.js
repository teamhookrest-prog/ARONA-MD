import axios from "axios";
import FormData from "form-data";
import path from "path";
import fs from "fs";
import { fileTypeFromBuffer } from "file-type";

const API_URL = "https://api2.pixelcut.app/image/matte/v1";
const HEADERS = {
    "x-client-version": "web",
    "User-Agent": "Mozilla/5.0",
    "Origin": "https://douyin-drab-nu.vercel.app",
    "Referer": "https://douyin-drab-nu.vercel.app/"
};

async function removeBackground(image) {
    try {
        const form = new FormData();

        if (Buffer.isBuffer(image)) {
            const { ext, mime } = await fileTypeFromBuffer(image) || { ext: "png", mime: "image/png" };
            form.append("image", image, { filename: `image.${ext}`, contentType: mime });
        } else {
            throw new Error("Input harus buffer media");
        }

        form.append("format", "png");

        const res = await axios.post(API_URL, form, {
            headers: { ...HEADERS, ...form.getHeaders() },
            responseType: "arraybuffer",
            timeout: 25000
        });

        return Buffer.from(res.data);

    } catch (err) {
        console.log(`[❌ ERROR] ${err.message}`);
        throw new Error("Gagal remove background!");
    }
}

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = q.mimetype || q.msg?.mimetype || "";

        if (!/image\/(png|jpe?g|webp)/i.test(mime)) {
            return m.reply(
`⚠️ Reply atau kirim foto lalu ketik:

> *${usedPrefix + command}*`
            );
        }

        const buff = await q.download();

        await m.reply("⏳ *Processing... Tunggu bentar ya!*");

        const result = await removeBackground(buff);

        await conn.sendMessage(m.chat, {
            image: result,
            fileName: "no_bg.png",
            mimetype: "image/png",
            caption: "✅ Background berhasil dihapus!"
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply("❌ Error: Gagal menghapus background.\nCoba lagi nanti.");
    }
};

handler.help = ["removebg", "nobg", "bgremove"];
handler.tags = ["tools"];
handler.command = /^(removebg|nobg|bgremove)$/i;
handler.limit = true;

export default handler;