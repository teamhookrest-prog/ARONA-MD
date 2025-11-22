import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`ᴋɪʀɪᴍ ʟɪɴᴋ ʏᴏᴜᴛᴜʙᴇɴʏᴀ ʏᴜᴋ ♡\n\nᴄᴏɴᴛᴏʜ:\n${usedPrefix + command} https://youtu.be/dQw4w9WgXcQ`)

    let url = args[0]
    if (!url.match(/youtube\.com|youtu\.be|youtube-nocookie\.com/)) return m.reply('ʟɪɴᴋ ʜᴀʀᴜs ᴅᴀʀɪ ʏᴏᴜᴛᴜʙᴇ ʏᴀ ♡')

    await m.reply('sᴇᴅᴀɴɢ ᴍᴇɴɢᴀᴍʙɪʟ ᴠɪᴅᴇᴏ... (ᴍᴀᴋs 720ᴘ)')

    try {
        const apiUrl = `https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(url)}&format=720`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })

        if (!data.status || !data.result?.download) throw 'ɢᴀɢᴀʟ ᴀᴍʙɪʟ ᴅᴀᴛᴀ ᴠɪᴅᴇᴏ'

        const res = data.result

        const caption = `
ʏᴛ ᴠɪᴅᴇᴏ ♡

*ᴊᴜᴅᴜʟ:* ${res.title}
*ᴄʜᴀɴɴᴇʟ:* ${res.author.channelTitle}
*ᴠɪᴇᴡs:* ${res.metadata.view}
*ᴅᴜʀᴀsɪ:* ${res.metadata.duration}
*ᴜᴘʟᴏᴀᴅ:* ${res.metadata.ago}

ᴋᴜᴀʟɪᴛᴀs ᴍᴀᴋsɪᴍᴀʟ 720ᴘ • ᴛᴀɴᴘᴀ ᴡᴀᴛᴇʀᴍᴀʀᴋ ♡
        `.trim()

        await conn.sendMessage(m.chat, {
            video: { url: res.download },
            mimetype: 'video/mp4',
            caption,
            contextInfo: {
                externalAdReply: {
                    title: res.title.length > 40 ? res.title.slice(0, 37) + '...' : res.title,
                    body: res.author.channelTitle,
                    thumbnailUrl: res.thumbnail,
                    sourceUrl: res.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

        // Kirim thumbnail + info tambahan (biar lebih aesthetic)
        await conn.sendMessage(m.chat, {
            image: { url: res.thumbnail },
            caption: `${res.title}\n\n© ${res.author.channelTitle}`
        }, { quoted: m })

    } catch (e) {
        console.log(e)
        m.reply('ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ᴠɪᴅᴇᴏ :(\nᴄᴏʙᴀ ʟᴀɢɪ ᴅᴇɴɢᴀɴ ʟɪɴᴋ ʟᴀɪɴ ʏᴜᴋ ♡')
    }
}

handler.help = ['ytmp4', 'ytv', 'ytvideo']
handler.tags = ['download']
handler.command = /^(ytmp4|ytv|ytvideo)$/i
handler.limit = true

export default handler