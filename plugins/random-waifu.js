import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
    try {
        const res = await fetch('https://hookrestapi.vercel.app/random/waifu')

        if (!res.ok)
            return m.reply('> *API bermasalah, coba lagi.*')

        const buffer = await res.buffer()

        await conn.sendMessage(
            m.chat,
            {
                image: buffer,
                caption: '> *Random Waifu*'
            },
            { quoted: m }
        )

    } catch (e) {
        m.reply('> *Gagal memproses gambar.*')
    }
}

handler.help = ['waifu']
handler.tags = ['random']
handler.command = /^waifu$/i

export default handler