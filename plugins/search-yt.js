import yts from 'yt-search'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`Contoh: ${usedPrefix}${command} menepi ngatmombilung`)

    const query = args.join(' ')
    await m.reply('Mencari di YouTube...')

    try {
        const search = await yts(query)
        const results = search.videos.slice(0, 5)
        if (results.length === 0) throw 'Tidak ada hasil ditemukan'

        const top = results[0]

        // Format durasi
        const formatDuration = (seconds) => {
            if (!seconds) return 'Live'
            const h = Math.floor(seconds / 3600)
            const m = Math.floor((seconds % 3600) / 60)
            const s = seconds % 60
            return [h, m, s]
                .map(v => v.toString().padStart(2, '0'))
                .filter((v, i) => v !== '00' || i > 0)
                .join(':')
        }

        let text = `YOUTUBE SEARCH\n\n`
        text += `Pencarian  : ${query}\n`
        text += `Ditemukan  : ${results.length} video\n`
        text += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`

        results.forEach((v, i) => {
            const duration = formatDuration(v.seconds)
            const views = v.views.toLocaleString('id-ID')
            const ago = v.ago?.replace('years ago', 'thn lalu')
                              .replace('year ago', 'thn lalu')
                              .replace('months ago', 'bln lalu')
                              .replace('days ago', 'hari lalu')
                              .replace('ago', 'lalu') || 'Baru saja'

            text += `${i + 1}. ${v.title}\n`
            text += `    Durasi   : ${duration}\n`
            text += `    Views    : ${views}\n`
            text += `    Channel  : ${v.author.name}\n`
            text += `    Upload   : ${ago}\n`
            text += `    Link     : ${v.url}\n\n`
        })

        text += `━━━━━━━━━━━━━━━━━━━━━━━\n`
        text += `Download:\n`
        text += `• ${usedPrefix}ytmp4 <link> → Video\n`
        text += `• ${usedPrefix}ytmp3 <link> → Audio\n`
        text += `Reply nomor hasil dengan perintah di atas`

        // Kirim thumbnail video pertama + teks rapih
        await conn.sendFile(m.chat, top.thumbnail, 'ytsearch.jpg', text.trim(), m)

    } catch (e) {
        console.log(e)
        m.reply('Gagal mencari video. Coba kata kunci lain atau cek koneksi.')
    }
}

handler.help = ['ytsearch', 'yts', 'yt']
handler.tags = ['search']
handler.command = /^(ytsearch|yts|yt)$/i
handler.limit = true

export default handler