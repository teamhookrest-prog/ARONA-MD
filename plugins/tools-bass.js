import { exec } from "child_process"
import fs from "fs"
import { toPTT } from "../function/converter.js"

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = q?.mimetype || ""
    
    if (!/audio/.test(mime)) return m.reply(`Balas audio lalu ketik ${usedPrefix+command} <level>`)

    let level = parseInt(text) || 10
    let buffer = await q.download()
    let input = "./tmp/input.ogg"
    let output = "./tmp/output.ogg"

    fs.writeFileSync(input, buffer)

    exec(`ffmpeg -y -i ${input} -af "bass=g=${level}" ${output}`, async (err) => {
        if (err) return m.reply("Proses gagal.")

        let audio = fs.readFileSync(output)
        let ptt = await toPTT(audio)

        await conn.sendMessage(m.chat, {
            audio: ptt.data,
            ptt: true,
            mimetype: "audio/ogg; codecs=opus"
        }, { quoted: m })

        fs.unlinkSync(input)
        fs.unlinkSync(output)
    })
}

handler.help = ["bass <level>"]
handler.tags = ["tools"]
handler.command = /^bass$/i

export default handler