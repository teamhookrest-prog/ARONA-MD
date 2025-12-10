import { toPTT } from '../function/converter.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        // Ambil pesan media (reply atau pesan sendiri)
        let q = m.quoted ? m.quoted : m
        let mime = q.mimetype || q.msg?.mimetype || ""

        if (!mime || !mime.includes("/")) {
            return m.reply(
`> Kirim atau reply video/audio/voice note/dokumen
> lalu ketik *${usedPrefix + command}*`
            )
        }

        // Download buffer media
        let buffer = await q.download()

        // Konversi ke Opus (audio)
        const { data: opusData } = await toPTT(buffer)

        // Kirim hasil konversi sebagai file audio Opus
        await conn.sendMessage(m.chat, {
            audio: opusData,
            mimetype: 'audio/ogg; codecs=opus',
            fileName: 'audio.opus'
        }, { quoted: m })

        m.reply('✅ Media berhasil dikonversi ke format audio Opus!')

    } catch (e) {
        console.error(e)
        m.reply('❌ Gagal mengubah media menjadi audio Opus')
    }
}

handler.help = ['toaudio']
handler.tags = ['tools']
handler.command = /^toaudio|2audio|tomp3$/i
handler.limit = true

export default handler