let handler = async (m, { conn, usedPrefix, command, text }) => {
    let parts = text.split(' ')
    let hari = parseInt(parts[0])
    let targetText = parts.slice(1).join(' ')
    
    if (!hari || isNaN(hari) || hari < 1) {
        return conn.sendMessage(m.chat, { 
            text: `Format salah!\nContoh:\n${usedPrefix + command} 30\n${usedPrefix + command} 7 @user\n${usedPrefix + command} 365 6281234567890` 
        }, { quoted: m })
    }

    let who
    
    if (m.quoted) {
        who = m.quoted.sender
    } else if (targetText && targetText.includes('@')) {
        who = targetText.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    } else if (targetText && targetText.replace(/[^0-9]/g, '').length >= 10) {
        let nomor = targetText.replace(/[^0-9]/g, '')
        who = nomor + '@s.whatsapp.net'
    } else {
        who = m.sender
    }

    // PASTIKAN USER ADA DI DATABASE
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = {}
    }
    
    let user = global.db.data.users[who]
    let nama = await conn.getName(who) || "Unknown"
    
    // INISIALISASI FIELD
    if (!user.name) user.name = nama
    if (!user.limit || isNaN(user.limit)) user.limit = 10
    if (!user.exp) user.exp = 0
    if (!user.level) user.level = 0
    if (!user.register) user.register = false
    if (user.premium === undefined) user.premium = false
    if (!user.premiumTime) user.premiumTime = 0
    if (user.isUnlimitedLimit === undefined) user.isUnlimitedLimit = false

    let isPremiumBefore = user.premium && user.premiumTime > Date.now()
    
    let sekarang = Date.now()
    let tambahWaktu = hari * 24 * 60 * 60 * 1000
    
    let premiumTimeBaru = isPremiumBefore ? 
        Math.max(user.premiumTime, sekarang) + tambahWaktu : 
        sekarang + tambahWaktu

    // UPDATE PREMIUM
    user.premium = true
    user.premiumTime = premiumTimeBaru
    user.isUnlimitedLimit = true  // FIX UNLIMITED
    
    // JANGAN PAKAI -1 LAGI
    // user.limit = -1 ❌

    // === LOG ===
    console.log('🎯 ADD PREMIUM LOG:')
    console.log({
        user: who,
        name: user.name,
        premiumBefore: isPremiumBefore,
        newPremium: true,
        unlimited: true,
        activeUntil: new Date(premiumTimeBaru).toLocaleString()
    })
    console.log('===========================')

    let tanggalAktif = new Date(premiumTimeBaru).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    let message = 
`✅ PREMIUM BERHASIL DITAMBAHKAN

👤 User: @${who.split('@')[0]}
📛 Nama: ${nama}
⭐ Status: Premium User
🕒 Durasi: ${hari} hari
📅 Berlaku sampai: ${tanggalAktif}
🔋 Limit: Unlimited ♾️

${isPremiumBefore ? 
'🔁 Premium diperpanjang!' : 
'🎉 Selamat! Sekarang kamu premium user!'}`

    conn.sendMessage(m.chat, { 
        text: message, 
        mentions: [who] 
    }, { quoted: m })
    
    // SAVE DATABASE
    if (global.db && typeof global.db.saveDatabase === 'function') {
        try {
            await global.db.saveDatabase()
            console.log('💾 Database saved successfully')
        } catch (e) {
            console.error('❌ Error saving database:', e)
        }
    }
}

handler.help = ['addprem <hari> (@tag/reply/nomor)']
handler.tags = ['owner']
handler.command = /^(addprem|addpremium|tambahprem|premium)$/i
handler.owner = true

export default handler