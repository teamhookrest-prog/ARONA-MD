let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    if (!user || !user.register) return m.reply('Kamu belum daftar!')

    let pp
    try {
        pp = await conn.profilePictureUrl(m.sender, 'image')
    } catch {
        pp = 'https://telegra.ph/file/4d1e7c7d5d29f5b7e7c99.jpg'
    }

    let expNeeded = user.level === 0 ? 100 : user.level * 100 + Math.pow(user.level, 2) * 50
    let progress = expNeeded > 0 ? (user.exp / expNeeded) * 100 : 0
    
    // AUTO DETECT PREMIUM - 100% AKURAT
    let isPremiumActive = false
    if (user.premium && user.premiumTime) {
        const now = Date.now()
        const premiumTime = Number(user.premiumTime)
        isPremiumActive = premiumTime > now
        
        console.log('[ME PREMIUM CHECK]', {
            premium: user.premium,
            premiumTime: premiumTime,
            now: now,
            isActive: isPremiumActive,
            difference: premiumTime - now
        })
    }
    
    // TAMPILKAN UNLIMITED JIKA PREMIUM AKTIF
    let limitText = isPremiumActive ? 'Unlimited (Premium)' : user.limit
    
    console.log('[ME LIMIT DISPLAY]', {
        limitValue: user.limit,
        isPremiumActive: isPremiumActive,
        displayText: limitText
    })

    // FIX NAME
    let userName = 'Unknown'
    if (typeof user.name === 'string') {
        userName = user.name
    } else if (user.name) {
        userName = String(user.name)
    }

    let caption = `
PROFILE KAMU

Nama: ${userName}
Umur: ${user.age} tahun
Level: ${user.level}
Exp: ${user.exp} / ${expNeeded}
Progress: ${progress.toFixed(2)}%
Limit: ${limitText}
Premium: ${isPremiumActive ? 'AKTIF' : 'TIDAK AKTIF'}

Semakin sering chat, semakin cepat naik level!
    `.trim()

    await conn.sendMessage(m.chat, {
        image: { url: pp },
        caption: caption
    }, { quoted: m })
}

handler.help = ['me']
handler.tags = ['info']
handler.command = /^(me)$/i

export default handler