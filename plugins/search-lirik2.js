import axios from "axios"
import * as cheerio from "cheerio"

async function ambilLirik(query) {
    const url = `https://lirik.my/search/${encodeURIComponent(query)}`
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)

    const list = $('article').map((i, el) => ({
        judul: $(el).find('.entry-title a').text().trim(),
        link: $(el).find('.entry-title a').attr('href')
    })).get()

    const hasil = []

    for (const item of list) {
        if (!item.link) continue
        try {
            const res2 = await axios.get(item.link)
            const $2 = cheerio.load(res2.data)

            let lirik = $2('.entry-content').text().trim()

            lirik = lirik
                .replace(/Read More/gi, "")
                .replace(/\r/g, "")
                .replace(/\t+/g, " ")
                .replace(/ +/g, " ")
                .replace(/\n{2,}/g, "\n")
                .trim()

            lirik = lirik
                .replace(/(Chorus:)/gi, "\n\nChorus:\n")
                .replace(/([.!?])\s*/g, "$1\n")

            let baris = lirik.split("\n").map(v => v.trim()).filter(v => v.length > 0)

            let final = []
            let temp = []

            for (let line of baris) {
                temp.push(line)
                if (temp.length >= 4 || line.endsWith(".") || line.endsWith("?") || line.endsWith("!")) {
                    final.push(temp.join("\n"))
                    temp = []
                }
            }

            if (temp.length) final.push(temp.join("\n"))

            hasil.push({
                judul: item.judul,
                lirik: final.join("\n\n")
            })

        } catch {}
    }

    return hasil
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text)
        return m.reply(
`text Cara pakai:
${usedPrefix + command} judul_lagu

Contoh:
${usedPrefix + command} zivilia aishiteru`
        )

    await m.reply(`text Sedang mencari lirik: ${text}`)

    try {
        const data = await ambilLirik(text)
        if (!data.length) return m.reply(`text Lirik tidak ditemukan untuk: ${text}`)

        const lagu = data[0]

        const isi = 
`text LIRIK LAGU

Judul: ${lagu.judul}

────────────────────

${lagu.lirik}

────────────────────
Selesai.`

        await conn.reply(m.chat, isi.slice(0, 4000), m)

    } catch (err) {
        m.reply(`text Terjadi kesalahan: ${err.message}`)
    }
}

handler.help = ["lirik2"]
handler.tags = ["search"]
handler.command = /^lirik2|lyricss|liric2$/i

export default handler