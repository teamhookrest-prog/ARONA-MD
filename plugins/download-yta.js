import axios from 'axios'
import { toPTT } from '../function/converter.js'  // pakai converter internal (opus)

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`ᴋɪʀɪᴍ ʟɪɴᴋ ʏᴏᴜᴛᴜʙᴇɴʏᴀ ʏᴜᴋ ♡\n\nᴄᴏɴᴛᴏʜ:\n${usedPrefix + command} https://youtu.be/dQw4w9WgXcQ`)

    let url = args[0]
    if (!url.match(/youtube\.com|youtu\.be|youtube-nocookie\.com/)) return m.reply('ʟɪɴᴋ ʜᴀʀᴜs ᴅᴀʀɪ ʏᴏᴜᴛᴜʙᴇ ʏᴀ ♡')

    await m.reply('sᴇᴅᴀɴɢ ᴍᴇɴɢᴀᴍʙɪʟ ᴀᴜᴅɪᴏ...')

    try {
        const apiUrl = `https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(url)}&format=mp3`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })

        if (!data.status || !data.result?.download) throw 'ɢᴀɢᴀʟ ᴀᴍʙɪʟ ᴅᴀᴛᴀ ᴀᴜᴅɪᴏ'

        const res = data.result

        const caption = `
ʏᴛ ᴀᴜᴅɪᴏ ♡

*ᴊᴜᴅᴜʟ:* ${res.title}
*ᴄʜᴀɴɴᴇʟ:* ${res.author.channelTitle}
*ᴠɪᴇᴡs:* ${res.metadata.view}
*ᴅᴜʀᴀsɪ:* ${res.metadata.duration}
*ᴜᴘʟᴏᴀᴅ:* ${res.metadata.ago}

ᴏᴛᴏᴍᴀᴛɪs ᴊᴀᴅɪ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ ᴏᴘᴜs (ᴋᴜᴀʟɪᴛᴀs ᴊᴇʀɴɪʜ + ᴜᴋᴜʀᴀɴ ᴋᴇᴄɪʟ) ♡
        `.trim()

        // Ambil buffer MP3
        const audioBuffer = (await axios.get(res.download, { 
            responseType: 'arraybuffer',
            timeout: 60000 
        })).data

        // Konversi ke Opus + kirim sebagai voice note
        const { data: opusData } = await toPTT(audioBuffer, 'mp3')

        await conn.sendMessage(m.chat, {
            audio: opusData,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            waveform: [0, 100, 0, 100, 0, 100, 0, 100],
            contextInfo: {
                externalAdReply: {
                    title: res.title.length > 30 ? res.title.slice(0, 27) + '...' : res.title,
                    body: res.author.channelTitle,
                    thumbnailUrl: res.thumbnail,
                    sourceUrl: res.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

        // Kirim thumbnail + info
        await conn.sendMessage(m.chat, {
            image: { url: res.thumbnail },
            caption
        }, { quoted: m })

    } catch (e) {
        console.log(e)
        m.reply('ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ᴀᴜᴅɪᴏ :(\nᴄᴏʙᴀ ʟᴀɢɪ ᴅᴇɴɢᴀɴ ʟɪɴᴋ ʟᴀɪɴ ʏᴜᴋ ♡')
    }
}

handler.help = ['ytmp3', 'yta', 'ttaudio']
handler.tags = ['download']
handler.command = /^(ytmp3|yta|ttaudio|ytaudio)$/i
handler.limit = true

export default handler