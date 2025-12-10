import { createCanvas, loadImage } from 'canvas'
import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply('> *Masukkan teks pertanyaan untuk ustadz*')

    try {
        const templateUrl = 'https://files.catbox.moe/mj8qgt.jpg'
        const res = await fetch(templateUrl)
        const buffer = await res.buffer()

        const base = await loadImage(buffer)
        const canvas = createCanvas(base.width, base.height)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(base, 0, 0)

        ctx.fillStyle = '#000'
        ctx.textAlign = 'center'

        const paddingX = 100
        const x = canvas.width / 2
        const maxWidth = canvas.width - paddingX * 2
        const startY = 190
        const lineSpacing = 10

        const wrapText = (context, text, maxWidth) => {
            const words = text.split(' ')
            let lines = []
            let line = ''

            for (let i = 0; i < words.length; i++) {
                const test = line + words[i] + ' '
                const w = context.measureText(test).width
                if (w > maxWidth && i > 0) {
                    lines.push(line.trim())
                    line = words[i] + ' '
                } else line = test
            }
            lines.push(line.trim())
            return lines
        }

        let fontSize = 38
        ctx.font = `${fontSize}px Sans`
        const lineHeight = fontSize + lineSpacing

        const lines = wrapText(ctx, text, maxWidth)
        const totalHeight = lines.length * lineHeight

        const boxHeight = 120
        let y = startY + (boxHeight / 2) - (totalHeight / 2) + lineHeight / 2

        if (y + totalHeight > canvas.height - 50)
            y = canvas.height - totalHeight - 50

        for (let line of lines) {
            ctx.fillText(line, x, y)
            y += lineHeight
        }

        await conn.sendFile(m.chat, canvas.toBuffer(), 'ustadz.jpg', '', m)

    } catch (e) {
        m.reply('> *Terjadi kesalahan:* ' + e.message)
    }
}

handler.command = /^ustadz$/i
handler.help = ['ustadz <pertanyaan>']
handler.tags = ['maker']

export default handler