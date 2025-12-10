import axios from "axios"

const pinterestSession = {}

let handler = async (m, { conn, text, command }) => {
    const user = m.sender

    try {
        await conn.sendMessage(m.chat, {
            react: { text: "⚡", key: m.key }
        })
    } catch {}

    if (!text) return m.reply(
`Kirim query pencarian.

Contoh:
.pin Arona`
    )

    try {
        let { data } = await axios.get(
            `https://api.baguss.xyz/api/search/pinterest?q=${encodeURIComponent(text)}`
        )

        if (!data?.results?.length) return m.reply(`Tidak ada hasil ditemukan dari: ${text}`)

        pinterestSession[user] = {
            results: data.results,
            index: 0
        }

        let item = data.results[0]

        return conn.sendMessage(m.chat, {
            image: { url: item.image_url },
            caption:
`Result 1/${data.results.length}

${item.title}

Author : ${item.author.fullname} (@${item.author.username})
Followers : ${item.author.followers}

Link : ${item.pin_url}

Ketik *next* untuk melihat gambar berikutnya.`
        }, { quoted: m })

    } catch (e) {
        console.log(e)
        return m.reply("Terjadi kesalahan.")
    }
}

handler.before = async (m, { conn }) => {
    const user = m.sender
    if (!pinterestSession[user]) return
    if (m.text.toLowerCase() !== "next") return

    let session = pinterestSession[user]
    session.index++

    if (session.index >= session.results.length) {
        delete pinterestSession[user]
        return m.reply(`Semua gambar sudah ditampilkan.\nSession selesai.`)
    }

    let item = session.results[session.index]

    return conn.sendMessage(m.chat, {
        image: { url: item.image_url },
        caption:
`Result ${session.index + 1}/${session.results.length}

${item.title}

Author : ${item.author.fullname} (@${item.author.username})
Followers : ${item.author.followers}

Link : ${item.pin_url}

Ketik *next* untuk lanjut.`
    }, { quoted: m })
}

handler.help = ["pin <query>"]
handler.tags = ["search"]
handler.command = /^(pin|pinterest)$/i

export default handler