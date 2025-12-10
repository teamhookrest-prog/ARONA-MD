import axios from "axios"

let handler = async (m, { conn, text, command }) => {
    conn.Rin = conn.Rin || {}

    if (!text) {
        return m.reply(`Contoh:\n.${command} on`)
    }

    if (text.toLowerCase() === 'on') {
        conn.Rin[m.sender] = { messages: [] }
        return m.reply("*~ Arona* diaktifkan 😜")
    }

    if (text.toLowerCase() === 'off') {
        delete conn.Rin[m.sender]
        return m.reply("*~ Arona* dinonaktifkan ☺")
    }

    return m.reply("Format salah. Gunakan *.autoai on/off*")
}

handler.before = async (m, { conn }) => {
    conn.Rin = conn.Rin || {}

    // Hanya proses jika AI aktif
    if (!conn.Rin[m.sender]) return
    if (m.isBaileys && m.fromMe) return
    if (!m.text) return

    // Jangan respon prefix
    const pf = ['.', '/', '!', '#', '\\']
    if (pf.some(a => m.text.startsWith(a))) return

    const prompt = `kamu adalah ai yang imut bernama [ Arona ] gunakan [Arona di setiap perkataan kamu, kamu adalah salah satu anime yang sangat baik dari Blue Archive, kamu sangat ramah dan terkenal di kalangan anak muda sekarang, kanu itu asisten yang pintar disini, kamu berdiri atas kerja keras programer yang bernama danz-xzy atau panggil saja danz atau wirdan.`

    let requestData = {
        content: m.text,
        user: m.sender,
        prompt: prompt
    }

    try {
        const quoted = m.quoted || m
        const mime = quoted?.mimetype || quoted?.msg?.mimetype
        if (mime && /image/.test(mime)) {
            requestData.imageBuffer = await quoted.download()
        }

        let res = await axios.post("https://ai.siputzx.my.id", requestData)
        m.reply(res.data.result)
    } catch (e) {
        console.log("Server Error:", e)
        m.reply("⚠️ Server lagi bermasalah ya njing!!!")
    }
}

handler.help = ["autoai"]
handler.tags = ["ai"]
handler.command = /^autoai$/i
handler.limit = false

export default handler