import axios from "axios"
import FormData from "form-data"
import { fileTypeFromBuffer } from "file-type"

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

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = q.mimetype || q.msg?.mimetype || ""
        if (!mime || !mime.includes("image")) {
            return m.reply(
`> Kirim atau reply gambar
> lalu ketik *${usedPrefix + command}*`
            )
        }

        let buffer = await q.download()
        let url = await uploadTmp(buffer)

        let msg = 
`> *Image Uploaded*
> Host: tmpfiles.org

*URL:*
${url}

> Selesai.`

        return m.reply(msg)

    } catch (e) {
        console.log(e)
        m.reply("> Gagal mengunggah gambar.")
    }
}

handler.help = ["tourl"]
handler.tags = ["tools"]
handler.command = /^tourl$/i

export default handler