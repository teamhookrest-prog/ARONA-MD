let handler = async (m, { conn, usedPrefix, command }) => {
    let who

    // 1. Prioritas: reply pesan
    if (m.quoted) {
        who = m.quoted.sender
    }
    // 2. Ada tag
    else if (m.mentionedJid?.length > 0) {
        who = m.mentionedJid[0]
    }
    // 3. Tulis nomor langsung
    else if (m.text) {
        let nomor = m.text.trim().replace(/[^0-9]/g, '')
        if (nomor.length < 10) return m.reply(`Nomor ga valid Bang :v`)
        who = nomor + '@s.whatsapp.net'
    }
    // 4. Kalau ga ada apa-apa → reset limit sendiri (owner)
    else {
        who = m.sender
    }

    // Pastikan user ada di database
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = {
            name: await conn.getName(who) || "Unknown",
            limit: 10,
            exp: 0,
            level: 0,
            register: false,
            premium: false,
            banned: false,
            premiumTime: 0
        }
    }

    let user = global.db.data.users[who]
    let nama = await conn.getName(who)
    let sebelum = user.limit
    let isPremium = user.premium && user.premiumTime > Date.now()

    // RESET LANGSUNG - TANPA KONFIRMASI
    let limitSekarang = 0
    let pesanTambahan = ""

    if (isPremium) {
        // Reset premium user → jadi user biasa dengan limit 0
        user.premium = false
        user.premiumTime = 0
        user.limit = 0
        pesanTambahan = "\n\n📢 *Status user diturunkan dari Premium ke Regular!*"
    } else {
        // Reset user biasa ke 0
        user.limit = 0
    }

    m.reply(
`✅ *LIMIT BERHASIL DIRESET* 

👤 User : @${who.split('@')[0]}
📛 Nama : ${nama}
📊 Limit sebelum : ${sebelum === Infinity ? '♾️ Unlimited' : sebelum}
🎯 Limit sekarang : ${limitSekarang} limit${pesanTambahan}

💡 *Note:* User bisa dikasih limit lagi pake *.addlimit*`.trim(),
null,
{ mentions: [who] }
    )
}

handler.help = ['resetlimit (@tag/reply/nomor)']
handler.tags = ['owner']
handler.command = /^(resetlimit|resetlim|reslim)$/i
handler.owner = true

export default handler