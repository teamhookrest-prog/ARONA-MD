/*
Fitur : lirik search
create : v.d
note : search lirik ini menggunakan canvas, jadi hasilnya akan menampilkan gambar
sumber : https://whatsapp.com/channel/0029VbC7FMCBadmh6lTdmI21 ( jangan hapus sumber )
*/

import axios from 'axios'
import { createCanvas, registerFont } from 'canvas'
import fs from 'fs'
import path from 'path'

try {
    const fontsDir = path.resolve("./fonts")
    if (fs.existsSync(path.join(fontsDir, "Poppins-Bold.ttf")))
        registerFont(path.join(fontsDir, "Poppins-Bold.ttf"), { family: "Poppins", weight: "700" })
    if (fs.existsSync(path.join(fontsDir, "Poppins-Regular.ttf")))
        registerFont(path.join(fontsDir, "Poppins-Regular.ttf"), { family: "Poppins", weight: "400" })
} catch (e) { }

function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/)
    const lines = []
    let line = ""
    for (const word of words) {
        const test = line ? line + " " + word : word
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line)
            line = word
        } else line = test
    }
    if (line) lines.push(line)
    return lines
}

async function renderLyrics(song) {
    const { trackName, artistName, plainLyrics, syncedLyrics } = song
    let lyrics = syncedLyrics || plainLyrics || "Lirik tidak tersedia"

    if (syncedLyrics) {
        lyrics = lyrics.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '').replace(/\n\s*\n/g, '\n').trim()
    }

    const colWidth = 560
    const padding = 90
    const lineHeight = 48
    const lyricsFont = '400 32px Poppins, Sans-Serif'
    const titleFont = '700 68px Poppins, Sans-Serif'
    const artistFont = '400 38px Poppins, Sans-Serif'

    const tempCanvas = createCanvas(1, 1)
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.font = lyricsFont

    const paragraphs = lyrics.split('\n')
    const lyricLines = []
    for (const p of paragraphs) {
        if (!p.trim()) { lyricLines.push(""); continue }
        lyricLines.push(...wrapText(tempCtx, p.trim(), colWidth - 50))
        lyricLines.push("")
    }

    const linesPerCol = 24
    const colCount = Math.ceil(lyricLines.length / linesPerCol)
    const height = Math.max(1300, linesPerCol * lineHeight + padding * 2 + 200)
    const width = colWidth * colCount + padding * 2 + (colCount - 1) * 80

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, "#0f172a")
    grad.addColorStop(0.4, "#1e293b")
    grad.addColorStop(1, "#334155")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = "rgba(0,0,0,0.4)"
    ctx.fillRect(0, 0, width, height)

    ctx.font = titleFont
    ctx.fillStyle = "#e0e7ff"
    ctx.fillText(trackName.slice(0, 40), padding, 140)

    ctx.font = artistFont
    ctx.fillStyle = "#a5b4fc"
    ctx.fillText(artistName.slice(0, 50), padding, 200)

    ctx.font = lyricsFont
    ctx.fillStyle = "rgba(255,255,255,0.95)"
    let x = padding
    let y = 300
    let col = 0

    for (const line of lyricLines) {
        if (line === "") { y += lineHeight * 0.8; continue }

        if (y + lineHeight > height - padding) {
            col++
            x = padding + col * (colWidth + 80)
            y = 300

            ctx.strokeStyle = "rgba(255,255,255,0.12)"
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(x - 40, 80)
            ctx.lineTo(x - 40, height - padding)
            ctx.stroke()
        }

        ctx.fillText(line, x, y)
        y += lineHeight
    }

    ctx.font = "italic 18px Poppins, Sans-Serif"
    ctx.fillStyle = "rgba(255,255,255,0.35)"
    ctx.textAlign = "right"
    ctx.fillText("restwave.my.id • lyrics", width - padding, height - 50)

    return canvas.toBuffer('image/png')
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`ᴋɪʀɪᴍ ᴊᴜᴅᴜʟ ʟᴀɢᴜ ♡\n\nᴄᴏɴᴛᴏʜ: ${usedPrefix + command} menepi`)

    const query = args.join(' ')
    await m.reply('sᴇᴅᴀɴɢ ᴍᴇɴᴄᴀʀɪ ʟɪʀɪᴋ...')

    try {
        const { data } = await axios.get(`https://www.restwave.my.id/search/lirikv2?title=${encodeURIComponent(query)}`)
        if (!data.status || !data.result?.length) throw 'ɴᴏᴛ ғᴏᴜɴᴅ'

        const results = data.result.slice(0, 7)

        if (results.length === 1) {
            const buffer = await renderLyrics(results[0])
            await conn.sendMessage(m.chat, {
                image: buffer,
                caption: `${results[0].trackName} — ${results[0].artistName}`
            }, { quoted: m })
            return
        }

        let teks = `ʟɪʀɪᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ♡\n\nᴘɪʟɪʜ ɴᴏᴍᴏʀ ᴜɴᴛᴜᴋ ᴅɪᴊᴀᴅɪᴋᴀɴ ɢᴀᴍʙᴀʀ:\n\n`
        results.forEach((v, i) => {
            teks += `${i + 1}. *${v.trackName}*\n   ➤ ${v.artistName}\n\n`
        })

        const msg = await conn.sendMessage(m.chat, { text: teks.trim() }, { quoted: m })

        conn.lirikCanvas = conn.lirikCanvas || {}
        conn.lirikCanvas[m.chat] = { results, msg }

    } catch (e) {
        m.reply('ɢᴀɢᴀʟ ᴄᴀʀɪ ʟɪʀɪᴋ :(')
    }
}

handler.before = async (m, { conn }) => {
    conn.lirikCanvas = conn.lirikCanvas || {}
    const data = conn.lirikCanvas[m.chat]
    if (!data) return
    if (m.quoted?.id !== data.msg.id) return

    if (!isNaN(m.text)) {
        const i = parseInt(m.text) - 1
        if (i < 0 || i >= data.results.length) return

        m.reply('sᴇᴅᴀɴɢ ᴍᴇᴍʙᴜᴀᴛ ɢᴀᴍʙᴀʀ ʟɪʀɪᴋ...')

        const buffer = await renderLyrics(data.results[i])
        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: `${data.results[i].trackName} — ${data.results[i].artistName}`
        }, { quoted: m })

        delete conn.lirikCanvas[m.chat]
    }
}

handler.help = ['lirik <judul>']
handler.tags = ['search']
handler.command = /^(lirik|lyrics)$/i
handler.limit = true

export default handler