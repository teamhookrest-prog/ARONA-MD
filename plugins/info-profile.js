let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    if (!user.register) return m.reply('Kamu belum daftar!\nKetik .daftar nama.umur')

    let pp
    try {
        pp = await conn.profilePictureUrl(m.sender, 'image')
    } catch {
        pp = 'https://telegra.ph/file/4d1e7c7d5d29f5b7e7c99.jpg'
    }

    let expNeeded = user.level * 100 + Math.pow(user.level, 2) * 50
    let progress = (user.exp / expNeeded) * 100

    let caption = `
PROFILE KAMU

Nama: ${user.name}
Umur: ${user.age} tahun
Level: ${user.level}
Exp: ${user.exp} / ${expNeeded}
Progress: ${progress.toFixed(2)}%
Limit: ${user.limit === Infinity ? 'Unlimited (Premium)' : user.limit}

Semakin sering chat, semakin cepat naik level!
    `.trim()

    await conn.sendMessage(m.chat, {
        image: { url: pp },
        caption: caption
    }, { quoted: m })
}

handler.help = ['profile', 'me']
handler.tags = ['info']
handler.command = /^(profile|me)$/i

export default handler
