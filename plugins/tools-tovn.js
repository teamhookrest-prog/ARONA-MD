import { toPTT } from '../function/converter.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        // Ambil media (reply atau pesan sendiri)
        let q = m.quoted ? m.quoted : m
        let mime = q.mimetype || q.msg?.mimetype || ""

        if (!mime || !mime.includes("/")) {
            return m.reply(
`> Kirim atau reply audio/voice note/dokumen audio
> lalu ketik *${usedPrefix + command}*`
            )
        }

        // Download buffer media
        let buffer = await q.download()

        // Konversi ke Opus (voice note)
        const { data: opusData } = await toPTT(buffer)

        // Kirim voice note
        await conn.sendMessage(m.chat, {
            audio: opusData,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            waveform: [0,100,0,100,0,100,0,100]
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Gagal mengubah audio jadi voice note')
    }
}

handler.help = ['tovn']
handler.tags = ['tools']
handler.command = /^tovn$/i
handler.limit = true

export default handler