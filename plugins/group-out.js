let handler = async (m, { conn }) => {
    try {
        await conn.sendMessage(m.chat, {
            text: `👋 *Arona pamit keluar dari grup ini.*\nTerima kasih semuanya!`
        }, { quoted: m })

        await delay(1200)
        await conn.groupLeave(m.chat)

    } catch (err) {
        console.error('Gagal keluar dari grup:', err)
        m.reply(`❌ *Gagal keluar dari grup!*`)
    }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

handler.help = ['out', 'keluar']
handler.tags = ['group']
handler.command = /^(out|keluar)$/i
handler.admin = true
handler.group = true

export default handler