let handler = async (m, { conn }) => {
    if (!m.isGroup) return m.reply("Fitur ini hanya untuk grup.")

    let meta = await conn.groupMetadata(m.chat)
    let mem = meta.participants.map(v => v.id)

    let list = mem.map(v => `@${v.split("@")[0]}`).join('\n')

    let text = `
╔══「 TAG ALL 」══╗
${list}
╚═══════════════╝
`.trim()

    await conn.sendMessage(m.chat, {
        text,
        mentions: mem
    }, { quoted: m })
}

handler.help = ["tagall"]
handler.tags = ["group"]
handler.command = /^(tagall|ta)$/i
handler.group = true
handler.admin = true

export default handler