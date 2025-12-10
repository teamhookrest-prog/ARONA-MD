let handler = async (m, { conn }) => {
    let q = m.quoted ? m.quoted : m

    try {
        if (!q || !q.download) return m.reply('❌ Tidak ada media untuk dibaca!')

        let media = await q.download()
        if (!media) return m.reply('⚠️ Media gagal diambil!')

        await conn.sendFile(m.chat, media, 'readviewonce', '', m)
    } catch (e) {
        console.error(e)
        m.reply('❌ Gagal membuka media View Once!')
    }
}

handler.help = ['readviewonce', 'rvo', 'read', 'liat']
handler.tags = ['tools']
handler.command = /^readviewonce|rvo|read|liat$/i
handler.register = false

export default handler