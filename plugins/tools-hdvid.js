import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

let handler = async (m, { conn }) => {
    let tmpIn = join(tmpdir(), `${Date.now()}.mp4`)
    let tmpOut = join(tmpdir(), `${Date.now()}_hd.mp4`)

    try {
        let q = m.quoted ? m.quoted : m
        let mime = q.mimetype || q.msg?.mimetype || ''
        if (!/video/.test(mime)) return m.reply('Reply video yang ingin dijadikan HD.')

        m.reply('Memproses video ke kualitas HD...')

        const media = await q.download()
        await fs.writeFile(tmpIn, media)

        await new Promise((resolve, reject) => {
            ffmpeg(tmpIn)
                .outputOptions([
                    '-vf scale=1280:-2:flags=lanczos',
                    '-preset slow',
                    '-crf 18',
                    '-b:v 4000k',
                    '-b:a 192k',
                    '-movflags faststart'
                ])
                .on('error', reject)
                .on('end', resolve)
                .save(tmpOut)
        })

        await conn.sendFile(m.chat, tmpOut, 'HD.mp4', 'Video berhasil ditingkatkan ke HD.', m)

    } catch (e) {
        m.reply('Gagal memproses video.')
    } finally {
        if (await fs.stat(tmpIn).catch(() => false)) await fs.unlink(tmpIn)
        if (await fs.stat(tmpOut).catch(() => false)) await fs.unlink(tmpOut)
    }
}

handler.help = ['hdvideo']
handler.tags = ['tools']
handler.command = /^hdv|hdvideo|tovideohd$/i
handler.limit = true

export default handler