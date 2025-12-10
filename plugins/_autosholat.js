let autosholat = {}

const jadwalSholat = {
    Fajr: "04:49",
    Sunrise: "06:04",
    Dhuhr: "12:06",
    Asr: "15:21",
    Sunset: "18:08",
    Maghrib: "18:08",
    Isha: "19:38",
    Imsak: "04:39",
    Midnight: "00:06",
    Firstthird: "22:07",
    Lastthird: "02:06"
}

let handler = m => m

handler.before = async function (m) {

    this.autosholat = this.autosholat || autosholat

    const who = m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.fromMe
            ? this.user.jid
            : m.sender

    const id = m.chat

    const date = new Date((new Date).toLocaleString("en-US", {
        timeZone: "Asia/Jakarta"
    }))

    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const timeNow = `${hours}:${minutes}`

    const isActive = Object.values(this.autosholat).includes(true)
    if (id in this.autosholat && isActive) return

    for (const [sholat, waktu] of Object.entries(jadwalSholat)) {
        if (timeNow === waktu && !(id in this.autosholat)) {

            const caption = `Hai kak @${who.split`@`[0]},
Waktu *${sholat}* telah tiba, ambilah air wudhu dan segeralah shalat.

*${waktu}*
_untuk wilayah Jakarta dan sekitarnya._`

            this.autosholat[id] = [
                await this.reply(m.chat, caption, m, {
                    contextInfo: { mentionedJid: [who] }
                }),
                setTimeout(() => {
                    delete this.autosholat[id]
                }, 57000)
            ]
        }
    }
}

handler.disabled = false

export default handler