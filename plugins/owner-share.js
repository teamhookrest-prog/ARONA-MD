import sharp from "sharp"

async function makeThumbnail(buffer) {
    try {
        return await sharp(buffer)
            .resize(300) 
            .jpeg({ quality: 50 })
            .toBuffer()
    } catch {
        return null
    }
}

let handler = async (m, { conn, text }) => {
    if (!text || !text.includes("|")) {
        return m.reply(
`Format salah.

Gunakan:
.share <scraper/code> | <link> | <note>

Contoh:
.share code | https://pastebin.com/xxxx | Sesuaikan aja.`
        )
    }

    let q = m.quoted || m
    let mime = (q.msg || q).mimetype || ""

    let parts = text.split("|").map(v => v.trim())
    let type = parts[0]?.toLowerCase()
    let link = parts[1]
    let note = parts[2] || "-"

    if (!["code", "scraper"].includes(type)) {
        return m.reply(`Tipe hanya mendukung: code atau scraper`)
    }

    const caption =
`*sumber:* https://whatsapp.com/channel/0029VbBeWQfGZNCqvelPb62R
*${type}:* ${link}
*note:* \`${note}\``

    try {
        if (/image|video/.test(mime)) {
            const media = await q.download()
            const thumbnail = await makeThumbnail(media)

            await conn.sendMessage(m.chat, {
                [mime.includes("image") ? "image" : "video"]: media,
                caption,
                jpegThumbnail: thumbnail || null
            })
        } else {
            await conn.sendMessage(m.chat, { text: caption })
        }

    } catch (err) {
        console.error(err)
        return m.reply("Gagal mengirim format share, coba ulang.")
    }
}

handler.help = ["share <scraper/code> | <link> | <note>"]
handler.tags = ["owner"]
handler.owner = true
handler.command = /^share$/i

export default handler