import fs from "fs"
import path from "path"
import archiver from "archiver"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let handler = async (m, { conn }) => {
    const ownerNumber = global.owner?.[0] || "628xxx"
    const ownerJid = ownerNumber + "@s.whatsapp.net"
    const sendTo = m.chat.endsWith("@g.us") ? ownerJid : m.chat

    await conn.sendMessage(sendTo, {
        text: "sᴇᴅᴀɴɢ ᴍᴇᴍʙᴜᴀᴛ ʙᴀᴄᴋᴜᴘ ғᴜʟʟ ʙᴏᴛ...\n\nsᴇssɪᴏɴ ᴛɪᴅᴀᴋ ᴅɪɪᴋᴜᴛsᴇʀᴛᴀᴋᴀɴ ♡"
    }, { quoted: m })

    try {
        const backupFileName = `backup-${new Date().toISOString().slice(0,10)}.zip`
        const outputPath = path.join(__dirname, "..", backupFileName)
        const output = fs.createWriteStream(outputPath)
        const archive = archiver("zip", { zlib: { level: 9 } })

        archive.pipe(output)

        archive.glob("**/*", {
            cwd: path.join(__dirname, ".."),
            ignore: [
                "*.zip",
                "node_modules/**",
                "session/**",
                "sessions/**",
                "database.json",
                "package-lock.json"
            ]
        })

        await archive.finalize()

        await new Promise(resolve => output.on("close", resolve))

        const fileSize = (archive.pointer() / 1024 / 1024).toFixed(2)

        const caption = `
ʙᴀᴄᴋᴜᴘ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ

ᴛᴀɴɢɢᴀʟ   : ${new Date().toLocaleString("id-ID")}
ᴜᴋᴜʀᴀɴ   : ${fileSize} MB
ғɪʟᴇ     : ${backupFileName}

ғɪʟᴇ ʏᴀɴɢ ᴅɪʜɪɴᴅᴀʀɪ:
.zip | session | sessions | node_modules | database.json | package-lock.json
`.trim()

        await conn.sendMessage(sendTo, {
            document: fs.readFileSync(outputPath),
            mimetype: "application/zip",
            fileName: backupFileName,
            caption
        }, { quoted: m })

        fs.unlinkSync(outputPath)

    } catch (err) {
        await conn.sendMessage(sendTo, {
            text: "ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ʙᴀᴄᴋᴜᴘ\n" + err.message
        }, { quoted: m })
    }
}

handler.help = ["backup"]
handler.tags = ["owner"]
handler.command = /^(backup|bkp)$/i
handler.owner = true

export default handler