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
    else if (m.text && m.text.replace(usedPrefix + command, '').trim()) {
        let text = m.text.replace(usedPrefix + command, '').trim()
        let nomor = text.replace(/[^0-9]/g, '')
        if (nomor.length < 10) return m.reply(`Nomor ga valid Bang :v\nContoh: ${usedPrefix + command} 6281234567890`)
        who = nomor + '@s.whatsapp.net'
    }
    // 4. Kalau ga ada apa-apa → cek limit sendiri
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
    let isPremium = user.premium && user.premiumTime > Date.now()
    let status = isPremium ? '🌟 Premium User' : '👤 Regular User'
    
    // Format limit
    let limitDisplay
    if (isPremium) {
        limitDisplay = '♾️ Unlimited'
    } else if (user.limit === Infinity || user.limit === -1) {
        limitDisplay = '♾️ Unlimited'
    } else {
        limitDisplay = `${user.limit} limit`
    }

    // Info premium expiry
    let premiumInfo = ""
    if (isPremium) {
        let expiryDate = new Date(user.premiumTime).toLocaleDateString('id-ID')
        premiumInfo = `\n⏳ Masa aktif: ${expiryDate}`
    } else {
        premiumInfo = `\n🕐 Reset harian: 00:00 WIB`
    }

    let message = 
`📊 *INFO LIMIT USER*

👤 User : @${who.split('@')[0]}
📛 Nama : ${nama}
🎯 Status : ${status}
💎 Limit : ${limitDisplay}${premiumInfo}
📈 Level : ${user.level}
⭐ Exp : ${user.exp}

${isPremium ? '🎉 Enjoy fitur unlimited!' : '💡 Upgrade premium untuk limit unlimited!'}`.trim()

    conn.sendMessage(m.chat, { 
        text: message, 
        mentions: [who] 
    }, { quoted: m })
}

handler.help = ['ceklimit (@tag/reply/nomor)']
handler.tags = ['info']
handler.command = /^(ceklimit|checklimit|limit|lim)$/i

export default handler