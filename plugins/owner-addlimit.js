let handler = async (m, { conn, usedPrefix, command, text }) => {
    let parts = text.trim().split(' ')
    let jumlah = parseInt(parts[0])
    let targetText = parts.slice(1).join(' ')
    
    if (!jumlah || isNaN(jumlah) || jumlah < 1) {
        return conn.sendMessage(m.chat, { 
            text: `Format salah!\n\nContoh:\n${usedPrefix + command} 10\n${usedPrefix + command} 5 @user\n${usedPrefix + command} 20 6281234567890` 
        }, { quoted: m })
    }

    let who
    
    if (m.quoted) {
        who = m.quoted.sender
    } else if (targetText && targetText.includes('@')) {
        who = targetText.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    } else if (targetText && targetText.replace(/[^0-9]/g, '').length >= 10) {
        who = targetText.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    } else {
        who = m.sender
    }

    // Buat user kalau belum ada
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = {}
    }

    let user = global.db.data.users[who]
    let nama = await conn.getName(who) || "Unknown"

    // Inisialisasi field penting
    if (!user.name) user.name = nama
    if (!user.limit || isNaN(user.limit)) user.limit = 10
    if (!user.exp) user.exp = 0
    if (!user.level) user.level = 0
    if (!user.register) user.register = false
    if (user.premium === undefined) user.premium = false
    if (!user.premiumTime) user.premiumTime = 0
    if (user.isUnlimitedLimit === undefined) user.isUnlimitedLimit = false

    // Cek premium aktif
    let isPremiumActive = user.premium && user.premiumTime > Date.now() && user.isUnlimitedLimit

    if (isPremiumActive) {
        return conn.sendMessage(m.chat, { 
            text: `⚠️ User @${who.split('@')[0]} sedang premium dengan unlimited limit.\nTidak perlu tambah limit manual.`,
            mentions: [who]
        }, { quoted: m })
    }

    // Proses penambahan limit
    let limitSebelum = user.limit
    user.limit += jumlah

    let message = 
`🎁 *LIMIT BERHASIL DITAMBAH*

👤 User: @${who.split('@')[0]}
📛 Nama: ${nama}

➕ Ditambahkan: *${jumlah}*
📌 Sebelum: *${limitSebelum}*
📌 Sekarang: *${user.limit}*

✨ Jika ingin unlimited, gunakan: 
${usedPrefix}addprem <hari>`
    
    await conn.sendMessage(m.chat, { 
        text: message, 
        mentions: [who] 
    }, { quoted: m })

    // Save DB
    if (global.db && typeof global.db.saveDatabase === 'function') {
        try {
            await global.db.saveDatabase()
            console.log('💾 Database updated (addlimit)')
        } catch (err) {
            console.error('❌ Failed saving DB:', err)
        }
    }
}

handler.help = ['addlimit <jumlah> (@tag/nomor/reply)']
handler.tags = ['owner']
handler.command = /^(addlimit|tambahl|tambahlimit)$/i
handler.owner = true

export default handler