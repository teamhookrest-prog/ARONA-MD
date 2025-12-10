import cloudscraper from "cloudscraper";
const { html } = await (await import("js-beautify")).default;
import { toPTT } from "../function/converter.js"; // sesuai instruksi

async function checkCF(url) {
    try {
        const res = await cloudscraper({
            url,
            resolveWithFullResponse: true,
            encoding: null // biar body buffer
        });

        const h = res.headers;

        const isCF =
            h["server"]?.includes("cloudflare") ||
            h["cf-ray"] ||
            h["cf-cache-status"] ||
            h["cf-chl-bypass"] ||
            h["cf-chl-bypass-resp"];

        let statusResp = "🟢 OK";

        if (res.statusCode === 403) {
            statusResp = "🟥 Forbidden";
        } else if ((res.statusCode === 503 && isCF) || (res.statusCode === 429 && isCF)) {
            statusResp = "🔴 Challenge / Block";
        } else if (isCF) {
            statusResp = "🟠 Cloudflare Active";
        }

        let json = null;
        if (h["content-type"]?.includes("application/json")) {
            try {
                json = JSON.parse(res.body.toString());
            } catch {}
        }

        return {
            status: res.statusCode,
            cloudflare: isCF,
            statusResp,
            headers: h,
            body: String(res.body),
            buffer: Buffer.from(res.body),
            json,
        };

    } catch (err) {
        return {
            error: true,
            statusResp: "🔴 Request Failed",
            message: err.message
        };
    }
}



let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        const url = args[0];
        if (!url) return m.reply(`⚠️ Masukan link!\nContoh:\n> *${usedPrefix + command} https://example.com/*`);

        const ox = await checkCF(url);

        if (ox.error) return m.reply("❌ Request gagal, server blokir atau salah URL.");

        const content = (ox.headers["content-type"] || "").split(";")[0];

        const caption = `
*< GET RESULT >*
📌 *MIME:* ${content}
📶 *STATUS:* ${ox.statusResp} (${ox.status})
🛡 *CLOUDFLARE:* ${ox.cloudflare ? "✅ Aktif" : "❌ Tidak"}
🖥 *SERVER:* ${ox.headers?.server || "Unknown"}
        `.trim();

        await m.reply(caption);

        // === AUDIO NORMAL ===
        if (/mpeg|mp3|m4a|flac/i.test(content)) {
            return conn.sendMessage(m.chat, {
                audio: ox.buffer,
                mimetype: content
            }, { quoted: m });
        }

        // === AUDIO → VN (OPUS) pakai toPTT seperti tovn ===
        if (/ogg|aac|wav|opus/i.test(content)) {
            const { data: opus } = await toPTT(ox.buffer);

            return conn.sendMessage(m.chat, {
                audio: opus,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
                waveform: [50, 100, 30, 90, 20, 50, 10, 100]
            }, { quoted: m });
        }

        // === IMAGE ===
        if (/image/i.test(content)) {
            return conn.sendMessage(m.chat, {
                image: ox.buffer,
                caption: "📸 Image fetched!"
            }, { quoted: m });
        }

        // === VIDEO ===
        if (/video/i.test(content)) {
            return conn.sendMessage(m.chat, {
                video: ox.buffer,
                caption: "🎥 Video fetched!"
            }, { quoted: m });
        }

        // === HTML ===
        if (/html/i.test(content)) {
            const formatted = html(ox.body);
            return conn.sendMessage(m.chat, {
                document: Buffer.from(formatted),
                fileName: "result.html",
                mimetype: "text/html",
                caption: "📄 HTML fetched!"
            }, { quoted: m });
        }

        // === JSON ===
        if (/json/i.test(content)) {
            return m.reply("```json\n" + JSON.stringify(ox.json, null, 2) + "\n```");
        }

        // === FILE LAIN ===
        return conn.sendMessage(m.chat, {
            document: ox.buffer,
            fileName: "file." + (content.split("/")[1] || "bin"),
            mimetype: content,
            caption: "📁 File fetched!"
        }, { quoted: m });

    } catch (e) {
        console.log(e);
        m.reply("❌ Error internal.");
    }
};

handler.help = ["get", "fetch"];
handler.tags = ["tools"];
handler.command = /^get|fetch$/i;
handler.limit = false;
handler.owner = true;

export default handler;