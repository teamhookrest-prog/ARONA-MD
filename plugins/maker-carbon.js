import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let code = ''

    if (args.length > 0) {
        code = args.join(' ')
    } else if (m.quoted && m.quoted.text) {
        code = m.quoted.text
    } else {
        return m.reply(`ᴋɪʀɪᴍ ᴋᴏᴅᴇ ʏᴀɴɢ ᴍᴀᴜ ᴅɪᴊᴀᴅɪᴋᴀɴ ᴄᴀʀʙᴏɴ ♡\n\nᴄᴏɴᴛᴏʜ:\n${usedPrefix + command} console.log('hello world')\nᴀᴛᴀᴜ ʀᴇᴘʟʏ ᴋᴏᴅᴇ ᴅᴇɴɢᴀɴ ${usedPrefix + command}`)
    }

    if (code.trim().length < 3) return m.reply('ᴋᴏᴅᴇ ᴛᴇʀʟᴀʟᴜ ᴘᴇɴᴅᴇᴋ ♡')

    await m.reply('sᴇᴅᴀɴɢ ᴍᴇᴍʙᴜᴀᴛ ᴄᴀʀʙᴏɴ...')

    try {
        const url = `https://www.restwave.my.id/maker/carbon?code=${encodeURIComponent(code)}`
        const { data } = await axios.get(url, { responseType: 'arraybuffer' })

        const caption = `
ᴄᴀʀʙᴏɴ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ ♡

\`\`\`Ini results nya keren banget🤩\`\`\`
        `.trim()

        await conn.sendFile(m.chat, Buffer.from(data), 'carbon.png', caption, m)
    } catch (e) {
        m.reply('ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ᴄᴀʀʙᴏɴ, ᴄᴏʙᴀ ʟᴀɢɪ ʏᴜᴋ ♡')
    }
}

handler.help = ['carbon']
handler.tags = ['maker']
handler.command = /^(carbon|carb)$/i

export default handler