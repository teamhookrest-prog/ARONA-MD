import axios from 'axios'
import { toPTT } from '../function/converter.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`Kirim link TikTok\n\nContoh: ${usedPrefix + command} https://vt.tiktok.com/abc123`)

    const url = args[0]
    if (!url.match(/tiktok\.com|vt\.tiktok/)) return m.reply('Link harus dari TikTok')

    await m.reply('Sedang mengambil data TikTok...')

    try {
        const { data } = await axios.get('https://host.optikl.ink/download/tiktok', {
            params: { url },
            timeout: 30000
        })

        if (!data.ok || !data.detail) throw 'Tidak dapat mengambil data'

        const d = data.detail
        const dl = data.downloadUrls

        const caption = `TIKTOK DOWNLOADER

Author     : ${d.author || 'Unknown'} ${d.authorUsername ? '(@' + d.authorUsername + ')' : ''}
Deskripsi  : ${d.description || '(tanpa deskripsi)'}
Views      : ${formatNumber(d.view || 0)}
Likes      : ${formatNumber(d.like || 0)}
Comments   : ${formatNumber(d.comment || 0)}
Shares     : ${formatNumber(d.share || 0)}`

        // Kirim VIDEO + CAPTION SEKALIGUS
        if (dl.video) {
            await conn.sendFile(m.chat, dl.video, 'tiktok.mp4', caption, m)
        } else if (dl.video_wm) {
            await conn.sendFile(m.chat, dl.video_wm, 'tiktok.mp4', caption + '\n\nAda watermark', m)
        }

        // Kirim AUDIO jadi VOICE NOTE OPUS
        if (dl.music) {
            const buffer = (await axios.get(dl.music, { responseType: 'arraybuffer' })).data
            const { data: opus } = await toPTT(buffer, 'mp3')

            await conn.sendMessage(m.chat, {
                audio: opus,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true,
                waveform: [0, 100, 0, 100, 0, 100, 0, 100]
            }, { quoted: m })
        }

    } catch (e) {
        m.reply('Gagal download TikTok. Coba link lain.')
    }
}

function formatNumber(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return n + ''
}

handler.help = ['tiktes']
handler.tags = ['download']
handler.command = /^(tiktes)$/i
handler.limit = true

export default handler