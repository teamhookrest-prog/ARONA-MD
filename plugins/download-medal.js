import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`Kirim link Medal.tv\n\nContoh: ${usedPrefix + command} https://medal.tv/games/roblox/clips/abc123`)

    let url = args[0].trim()
    url = decodeURIComponent(url).replace(/&amp;/g, '&')

    if (!url.includes('medal.tv')) return m.reply('Link harus dari medal.tv')

    await m.reply('Sedang ambil video tanpa watermark...')

    try {
        const { data } = await axios.post(
            "https://medalbypass.vercel.app/api/clip",
            { url },
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/127.0 Mobile Safari/537.36",
                    "Origin": "https://medalbypass.vercel.app",
                    "Referer": "https://medalbypass.vercel.app/"
                },
                timeout: 30000
            }
        )

        if (!data.valid) throw new Error('invalid')

        const videoUrl = data.download || data.src
        if (!videoUrl) throw new Error('no video url')

        const videoBuffer = (await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 120000
        })).data

        await conn.sendMessage(m.chat, {
            video: Buffer.from(videoBuffer),
            mimetype: 'video/mp4',
            ptt: false,
            caption: ''
        }, { quoted: m })

    } catch {
        m.reply('Gagal ambil video tanpa watermark\n\nCoba copy ulang link dari Medal (pastikan bukan &amp;)\nAtau clipnya private / sudah dihapus')
    }
}

handler.help = ['medal', 'medaldl']
handler.tags = ['download']
handler.command = /^(medal|medaldl|medalvid)$/i
handler.limit = true

export default handler