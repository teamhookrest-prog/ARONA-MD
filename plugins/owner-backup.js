import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let handler = async (m, { conn }) => {
    const ownerNumber = global.owner[0] || '628xxx' // pastikan ada di config
    const ownerJid = ownerNumber + '@s.whatsapp.net'
    const isGroup = m.chat.endsWith('@g.us')
    const sendTo = isGroup ? ownerJid : m.chat

    await conn.sendMessage(sendTo, { 
        text: 'sᴇᴅᴀɴɢ ᴍᴇᴍʙᴜᴀᴛ ʙᴀᴄᴋᴜᴘ ғᴜʟʟ ʙᴏᴛ...\n\nsᴇssɪᴏɴ ᴛɪᴅᴀᴋ ᴀᴋᴀɴ ɪᴋᴜᴛ ᴅɪʙᴀᴄᴋᴜᴘ ♡' 
    }, { quoted: m })

    try {
        const backupFileName = `backup-bot-${new Date().toISOString().slice(0,10)}.zip`
        const outputPath = path.join(__dirname, '..', backupFileName)
        const output = fs.createWriteStream(outputPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', async () => {
            const fileSize = (archive.pointer() / 1024 / 1024).toFixed(2)
            const caption = `
ʙᴀᴄᴋᴜᴘ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ ᴅᴇɴɢᴀɴ ᴀᴍᴀɴ ♡

ᴛᴀɴɢɢᴀʟ   : ${new Date().toLocaleString('id-ID')}
ᴜᴋᴜʀᴀɴ   : ${fileSize} MB
ғɪʟᴇ     : ${backupFileName}

sᴇssɪᴏɴ, ᴀᴜᴛʜ, ᴄʀᴇᴅs, sᴛᴏʀᴇ — sᴇᴍᴜᴀɴʏᴀ ᴛɪᴅᴀᴋ ɪᴋᴜᴛ ᴅɪʙᴀᴄᴋᴜᴘ
            `.trim()

            await conn.sendMessage(sendTo, {
                document: fs.readFileSync(outputPath),
                mimetype: 'application/zip',
                fileName: backupFileName,
                caption
            }, { quoted: m })

            // Hapus file zip setelah dikirim
            fs.unlinkSync(outputPath)
        })

        archive.on('error', (err) => { throw err })
        archive.pipe(output)

        // === I G N O R E  LIST SUPER KETAT ===
        archive.glob('**/*', {
            cwd: path.join(__dirname, '..'),
            ignore: [
                '*.zip',                    // semua file zip
                'node_modules/**',
                '.git/**',
                'tmp/**',
                'session/**',               // folder session
                'sessions/**',              // kadang namanya sessions
                'auth*/**',                 // auth_info, auth_info_multi, dll
                'creds.json',               // Baileys creds
                'store*/**',                // store_multi, store, dll
                'baileys_store*/**',
                '.env',
                '.gitignore',
                'npm-debug.log',
                'yarn-error.log',
                'package-lock.json',
                'yarn.lock'
            ]
        })

        await archive.finalize()

    } catch (e) {
        console.log(e)
        await conn.sendMessage(sendTo, { 
            text: 'ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ʙᴀᴄᴋᴜᴘ :(\n\n' + e.message 
        }, { quoted: m })
    }
}

handler.help = ['backup']
handler.tags = ['owner']
handler.command = /^(backup|bkp)$/i
handler.owner = true

export default handler