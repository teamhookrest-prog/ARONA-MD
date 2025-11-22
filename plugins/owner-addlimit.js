let handler = async (m, { conn, text, usedPrefix, command }) => {
    let who
    let jumlah = 0

    // 1. REPLY PESAN ORANG
    if (m.quoted) {
        who = m.quoted.sender
        jumlah = parseInt(text.trim()) || 0
    }
    // 2. ADA TAG
    else if (m.mentionedJid?.length > 0) {
        who = m.mentionedJid[0]
        jumlah = parseInt(text.replace(/@[\d\w]+/g, '').trim()) || 0
    }
    // 3. LANGSUNG NOMOR + JUMLAH
    else {
        let input = text.trim().split(/\s+/)
        if (input.length < 2) return m.reply(`Cara pakai Bang:\n${usedPrefix + command} @tag 50\n${usedPrefix + command} 62895xxxx 100\nAtau reply pesan + ${usedPrefix + command} 25`)
        let nomor = input[0].replace(/[^0-9]/g, '')
        if (nomor.length < 10) return m.reply(`Nomor ga valid Bang :v`)
        who = nomor + '@s.whatsapp.net'
        jumlah = parseInt(input[1])
    }

    if (!jumlah || jumlah <= 0) return m.reply(`Masukin jumlah limitnya Bang! Contoh: ${usedPrefix + command} 50`)

    // Pastikan user ada di db
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = { limit: 10, name: await conn.getName(who) || "User" }
    }

    let sebelum = global.db.data.users[who].limit
    global.db.data.users[who].limit += jumlah

    m.reply(`*Limit berhasil ditambah!* 

User : @${who.split('@')[0]}
Nama : ${await conn.getName(who)}
Sebelum : ${sebelum} limit
Ditambah : +${jumlah}
Sekarang : *${global.db.data.users[who].limit} limit*`.trim(), null, { mentions: [who] })
}

handler.help = ['addlimit (@tag/nomor/reply) <jumlah>']
handler.tags = ['owner']
handler.command = /^(addlimit|tambahlimit|addlim)$/i
handler.owner = true

export default handler
