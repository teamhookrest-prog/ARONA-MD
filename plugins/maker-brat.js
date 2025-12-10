import axios from "axios"
import { Sticker, StickerTypes } from "wa-sticker-formatter"

let handler = async (m, { conn, text, usedPrefix, command }) => {

    // Ambil text dari reply kalau user nggak nulis manual
    if (!text && m.quoted && m.quoted.text) text = m.quoted.text

    if (!text) {
        return m.reply(
`Format salah 🥹

Contoh:
${usedPrefix + command} Hai 😁

Atau reply text lalu ketik:
${usedPrefix + command}`
        )
    }

    try {

        await m.reply("🎀 Membuat Brat Sticker... tunggu ya ♡")

        // Request ke API
        let url = `https://api.nekolabs.web.id/canvas/brat/v2?text=${encodeURIComponent(text)}`
        let { data } = await axios.get(url, { responseType: "arraybuffer" })

        // Konversi ke Sticker WebP
        let sticker = new Sticker(data, {
            type: StickerTypes.FULL,
            pack: "Brat Generator",
            author: "Bot"
        })

        let stickerBuffer = await sticker.toBuffer()

        // Kirim hasil sebagai sticker
        await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })

    } catch (err) {
        console.log(err)
        return m.reply("❌ Gagal membuat Brat Sticker.")
    }
}

handler.help = ["brat <text>"]
handler.tags = ["maker"]
handler.command = /^brat$/i

export default handler