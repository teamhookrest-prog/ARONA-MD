import axios from "axios";
import * as cheerio from "cheerio"; // FIX

class GoogleImageScraper {
    constructor() {
        this.BASE_URL = "https://www.google.com";
        this.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; AppleWebKit/537.36"
        };
    }

    async searchImages(query) {
        const params = {
            q: query,
            tbm: "isch",
            safe: "active",
            hl: "en"
        };

        try {
            const res = await axios.get(`${this.BASE_URL}/search`, {
                params,
                headers: this.headers
            });

            return this.parse(res.data);

        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    parse(html) {
        const $ = cheerio.load(html);
        const images = [];

        $("img").each((_, el) => {
            const img = $(el).attr("src");
            if (img && img.startsWith("http")) images.push(img);
        });

        return {
            success: true,
            results: [...new Set(images)]
        };
    }
}

async function fetchImage(url) {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return {
        buffer: Buffer.from(res.data),
        mimetype: res.headers["content-type"] || "image/jpeg"
    };
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const query = args.join(" ");
    if (!query) return m.reply(`📌 Contoh:\n> ${usedPrefix + command} kucing lucu`);

    const scraper = new GoogleImageScraper();
    const result = await scraper.searchImages(query);

    if (!result.success || !result.results.length)
        return m.reply("❌ Tidak ada hasil ditemukan.");

    const randomImg = result.results[Math.floor(Math.random() * result.results.length)];
    const file = await fetchImage(randomImg);

    await conn.sendMessage(
        m.chat,
        {
            image: file.buffer,
            caption: `🔍 *Google Image Result*\n📝 Query: *${query}*`
        },
        { quoted: m }
    );
};

handler.help = ["gimage", "googleimg"];
handler.tags = ["internet"];
handler.command = /^(gimage|googleimg|imgsearch)$/i;
handler.limit = true;

export default handler;