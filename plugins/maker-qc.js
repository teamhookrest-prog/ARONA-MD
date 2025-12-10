import axios from "axios"
import FormData from "form-data"
import { fileTypeFromBuffer } from "file-type"
import { Sticker, StickerTypes } from "wa-sticker-formatter"

async function uploadTmp(buffer) {
    const { ext } = await fileTypeFromBuffer(buffer)
    const filename = `upload_${Date.now()}.${ext}`
    const data = new FormData()
    data.append("file", buffer, { filename })

    const r = await axios.post("https://tmpfiles.org/api/v1/upload", data, {
        headers: {
            ...data.getHeaders(),
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://tmpfiles.org/"
        }
    })

    const match = /tmpfiles\.org\/([^"]+)/.exec(r.data.data.url)
    return "https://tmpfiles.org/dl/" + match[1]
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text.includes("|")) {
        return m.reply(`Format salah!\nContoh:\n${usedPrefix + command} Wirdan | aku ganteng`)
    }

    let [name, quote] = text.split("|").map(v => v.trim())

    try {
        let profileUrl
        
        if (m.quoted && m.quoted.mimetype?.includes("image")) {
            let buffer = await m.quoted.download()
            profileUrl = await uploadTmp(buffer)
        } else {
            try {
                profileUrl = await conn.profilePictureUrl(m.sender, "image")
            } catch {
                profileUrl = "https://i.ibb.co/4YBNyvM/no-profile.jpg"
            }
        }

        let url = `https://api.nekolabs.web.id/canvas/quote-chat?text=${encodeURIComponent(quote)}&name=${encodeURIComponent(name)}&profile=${encodeURIComponent(profileUrl)}&color=%23333`

        await m.reply("🎨 Membuat Quote Sticker... tunggu ya ♡")

        // Ambil buffer dari API
        let { data } = await axios.get(url, { responseType: "arraybuffer" })

        // Convert ke sticker WebP
        let sticker = new Sticker(data, {
            type: StickerTypes.FULL,
            pack: "Quote Generator",
            author: name
        })

        let stickerBuffer = await sticker.toBuffer()

        // Kirim sticker final
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer
        }, { quoted: m })

    } catch (e) {
        console.log(e)
        m.reply("❌ Gagal membuat Sticker, API atau gambar error.")
    }
}

handler.help = ["qc <nama> | <text>"]
handler.tags = ["maker"]
handler.command = /^qc$/i

export default handler