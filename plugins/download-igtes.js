import axios from "axios"

const API_URL = "https://host.optikl.ink/download/instagram"

let handler = async (m, { conn, args, usedPrefix, command }) => {

    if (!args[0]) {
        return m.reply(`Masukan link Instagram.\nContoh: ${usedPrefix + command} https://www.instagram.com/reel/xxxx`)
    }

    const url = args[0]
    if (!/instagram\.com|instagr\.am/i.test(url)) {
        return m.reply("Link tidak valid. Hanya mendukung Instagram.")
    }

    await m.reply("Mengambil data...")

    try {

        const { data } = await axios.get(API_URL, {
            params: { url },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            timeout: 30000
        })

        if (!data.ok || !data.downloadUrls || !data.detail) {
            throw new Error("Data tidak ditemukan")
        }

        const detail = data.detail
        const media = data.downloadUrls

        const caption = [
            `INSTAGRAM DOWNLOADER`,
            ``,
            `Username   : ${detail.username || "-"}`,
            `Caption    : ${detail.caption || "(kosong)"}`,
            `Likes      : ${format(detail.like_count)}`,
            `Comments   : ${format(detail.comment_count)}`,
            `Total Media: ${media.length}`
        ].join("\n")

        // kirim media satu per satu
        for (let i = 0; i < media.length; i++) {

            const item = media[i]
            const ext = item.type === "mp4" ? ".mp4" : ".jpg"

            if (item.type === "mp4") {
                await conn.sendFile(m.chat, item.url, "instagram.mp4", caption, m)
            } else {
                await conn.sendFile(m.chat, item.url, "instagram.jpg", caption, m)
            }

            await delay(1200) // biar ga spam terlalu cepat
        }

    } catch (err) {
        return m.reply("Gagal mengambil data. Coba link lain.")
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function format(n) {
    if (!n) return "0"
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K"
    return n.toString()
}

handler.help = ["igtes"]
handler.tags = ["download"]
handler.command = /^(igtes)$/i
handler.limit = true

export default handler