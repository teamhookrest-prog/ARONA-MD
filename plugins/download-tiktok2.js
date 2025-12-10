import axios from 'axios'
import { toPTT } from '../function/converter.js' 

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`ᴋɪʀɪᴍ ʟɪɴᴋ ᴛɪᴋᴛᴏᴋɴʏᴀ ʏᴜᴋ ♡\n\nᴄᴏɴᴛᴏʜ:\n${usedPrefix + command} https://vt.tiktok.com/abc123`)

    const url = args[0]
    if (!url.match(/tiktok\.com|vt\.tiktok/)) return m.reply('ʟɪɴᴋ ʜᴀʀᴜs ᴅᴀʀɪ ᴛɪᴋᴛᴏᴋ ʏᴀ ♡')

    const wait = await m.reply('sᴇᴅᴀɴɢ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀᴛᴀ...\nꜱᴀʙᴀʀ ʏᴀ 10–30 ᴅᴇᴛɪᴋ ♡')

    try {
        const { data } = await axios.get('https://host.optikl.ink/download/tiktok', {
            params: { url },
            timeout: 40000
        })

        if (!data?.ok || !data.downloadUrls) {
            throw 'ᴠɪᴅᴇᴏ ᴛ� ᴘʀɪᴠᴀᴛᴇ / ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ'
        }

        const { detail, downloadUrls } = data

        const caption = `
ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ♡

ᴜsᴇʀ : @${detail.author?.unique_id || 'unknown'}
ᴊᴜᴅᴜʟ : ${detail.description || 'tanpa caption'}
Likes : ${detail.digg_count?.toLocaleString('id-ID') || '0'}
ᴋᴏᴍᴇɴ : ${detail.comment_count?.toLocaleString('id-ID') || '0'}
        `.trim()

        await conn.sendMessage(m.chat, { delete: wait.key })

        // 1. VIDEO TANPA WATERMARK (PRIORITAS)
        if (downloadUrls.video) {
            return await conn.sendFile(m.chat, downloadUrls.video, 'tiktok.mp4', caption, m)
        }

        // 2. VIDEO DENGAN WATERMARK
        if (downloadUrls.video_wm) {
            return await conn.sendFile(m.chat, downloadUrls.video_wm, 'tiktok.mp4', caption + '\n\n*ada watermark ya*', m)
        }

        // 3. MUSIK → JADI VOICE NOTE OPUS (PAKAI toPTT!)
        if (downloadUrls.music) {
            const audioBuffer = (await axios.get(downloadUrls.music, { 
                responseType: 'arraybuffer',
                timeout: 60000 
            })).data

            const { data: opusData } = await toPTT(audioBuffer, 'mp3')

            return await conn.sendMessage(m.chat, {
                audio: opusData,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: false,
                waveform: [0, 100, 0, 100, 0, 100, 0, 100],
                contextInfo: {
                    externalAdReply: {
                        title: detail.description?.slice(0, 40) || 'TikTok Audio',
                        body: `@${detail.author?.unique_id || 'unknown'}`,
                        thumbnailUrl: detail.cover || '',
                        sourceUrl: url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })
        }

        // 4. SLIDE FOTO
        if (downloadUrls.images && downloadUrls.images.length > 0) {
            await m.reply('sᴇᴅᴀɴɢ ᴋɪʀɪᴍ sʟɪᴅᴇ ғᴏᴛᴏ...')
            for (const img of downloadUrls.images.slice(0, 15)) {
                await conn.sendFile(m.chat, img, 'slide.jpg', 'sʟɪᴅᴇ ғᴏᴛᴏ', m)
                await new Promise(r => setTimeout(r, 1200))
            }
            return
        }

        throw 'ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴍᴇᴅɪᴀ ʏᴀɴɢ ʙɪsᴀ ᴅɪᴜɴᴅᴜʜ'
    } catch (e) {
        console.log(e)
        await conn.sendMessage(m.chat, { delete: wait.key }).catch(() => {})
        m.reply('ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ ᴛɪᴋᴛᴏᴋ :(\nᴄᴏʙᴀ ʟᴀɢɪ ᴅᴇɴɢᴀɴ ʟɪɴᴋ ʟᴀɪɴ ᴀᴛᴀᴜ ᴛᴜɴɢɢᴜ ʙᴇʙᴇʀᴀᴘᴀ ᴍᴇɴɪᴛ ʏᴜᴋ ♡')
    }
}

handler.help = ['tiktok2 <link>', 'tt2 <link>']
handler.tags = ['downloader']
handler.command = /^(tiktok2|tt2|tik2|tiktokdl2)$/i
handler.limit = true

export default handler