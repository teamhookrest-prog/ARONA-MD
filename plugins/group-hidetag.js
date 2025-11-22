let handler = async (m, { conn, text }) => {
    if (!m.isGroup) return m.reply("Hanya untuk grup.")

    let meta = await conn.groupMetadata(m.chat)
    let mem = meta.participants.map(v => v.id)

    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ""

    if (/image|video|audio|document/.test(mime)) {
        let buffer = await q.download()
        let type = mime.split('/')[0]

        if (type === 'image') {
            return conn.sendMessage(m.chat, {
                image: buffer,
                caption: text || "",
                mentions: mem
            }, { quoted: m })
        }

        if (type === 'video') {
            return conn.sendMessage(m.chat, {
                video: buffer,
                caption: text || "",
                mentions: mem
            }, { quoted: m })
        }

        if (type === 'audio') {
            return conn.sendMessage(m.chat, {
                audio: buffer,
                ptt: false,
                mentions: mem
            }, { quoted: m })
        }

        if (type === 'document') {
            return conn.sendMessage(m.chat, {
                document: buffer,
                fileName: "file",
                mimetype: mime,
                mentions: mem
            }, { quoted: m })
        }
    }

    await conn.sendMessage(m.chat, {
        text: text || "",
        mentions: mem
    }, { quoted: m })
}

handler.help = ["hidetag", " h"]
handler.tags = ["group"]
handler.command = /^hidetag|h$/i
handler.group = true
handler.admin = true

export default handler