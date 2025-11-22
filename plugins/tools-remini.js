import axios from "axios"
import fetch from "node-fetch"
import FormData from "form-data"
import { fileTypeFromBuffer } from "file-type"

// =========================
//   Uploader TMPFILES
// =========================
async function uploadTmpFiles(buffer) {
    const { ext } = await fileTypeFromBuffer(buffer)
    const filename = `file_${Date.now()}.${ext}`

    const data = new FormData()
    data.append("file", buffer, { filename })

    let res = await axios.post("https://tmpfiles.org/api/v1/upload", data, {
        headers: {
            ...data.getHeaders(),
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://tmpfiles.org/"
        }
    })

    const match = /tmpfiles\.org\/([^"]+)/.exec(res.data.data.url)
    if (!match) return null

    return "https://tmpfiles.org/dl/" + match[1]
}

// =========================
//   PLUGIN HDR
// =========================
let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = q.mimetype || q.msg?.mimetype || ""

        if (!mime || !mime.includes("image"))
            return m.reply(`Kirim atau reply gambar dengan perintah:\n${usedPrefix + command}`)

        let buffer = await q.download()

        // Upload sekali agar tidak spam API
        let imageUrl = await uploadTmpFiles(buffer)
        if (!imageUrl) return m.reply("Gagal upload gambar.")

        // Request HDR API
        let api = `https://hookrestapi.vercel.app/tools/hdr?url=${encodeURIComponent(imageUrl)}`
        let hasil = await axios.get(api, { responseType: "arraybuffer" })

        // Kirim hasil HDR
        return conn.sendMessage(m.chat, {
            image: hasil.data,
            caption: "*HDR Image Success*"
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply("Gagal memproses gambar.")
    }
}

handler.help = ["hdr", "hd", "enhance"]
handler.tags = ["tools"]
handler.command = /^hdr|hd|enhance$/i

export default handler