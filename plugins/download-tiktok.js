import axios from 'axios'
import { toPTT } from '../function/converter.js'   // pastikan path bener

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`ᴋɪʀɪᴍ ʟɪɴᴋ ᴛɪᴋᴛᴏᴋɴʏᴀ ♡\n\nᴄᴏɴᴛᴏʜ: ${usedPrefix + command} https://vt.tiktok.com/ZS8abc123/`)

    const url = args[0]

    if (!url.match(/tiktok\.com|vt\.tiktok/)) return m.reply('ʟɪɴᴋ ʜᴀʀᴜs ᴅᴀʀɪ ᴛɪᴋᴛᴏᴋ ʏᴜᴋ ♡')

    await m.reply('sᴇᴅᴀɴɢ ᴍᴇɴɢᴀʀɪ ᴠɪᴅᴇᴏ...')

    try {
        const { data } = await axios.get(`https://www.restwave.my.id/download/tiktok?url=${encodeURIComponent(url)}`)

        if (!data.status) throw 'ᴀᴘɪ ᴇʀʀᴏʀ'

        const res = data.result.data

        const videoUrl = res.hdplay || res.wmplay || res.play
        const musicUrl = res.music

        const caption = `
ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ♡

ᴜsᴇʀ : ${res.author.nickname} (@${res.author.unique_id})
ᴊᴜᴅᴜʟ : ${res.title.trim()}
❤️ : ${Number(res.digg_count).toLocaleString('id-ID')}
💬 : ${Number(res.comment_count).toLocaleString('id-ID')}
🔗 : ${url}
        `.trim()

        await conn.sendFile(m.chat, videoUrl, 'tiktok.mp4', caption, m)

        const audioBuffer = (await axios.get(musicUrl, { responseType: 'arraybuffer' })).data

        const { data: opusData } = await toPTT(audioBuffer, 'mp3')

        await conn.sendMessage(m.chat, {
            audio: opusData,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: m })

    } catch (e) {
        console.log(e)
        m.reply('ɢᴀɢᴀʟ ᴅ�ᴅᴏᴡɴʟᴏᴀᴅ ᴛɪᴋᴛᴏᴋ :(\nʟɪɴᴋ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ ᴀᴛᴀᴜ sᴇʀᴠᴇʀ sᴇᴅᴀɴɢ ᴇʀʀᴏʀ')
    }
}

handler.help = ['tiktok', 'tt']
handler.tags = ['download']
handler.command = /^(tiktok|tt|tik)$/i
handler.limit = true

export default handler