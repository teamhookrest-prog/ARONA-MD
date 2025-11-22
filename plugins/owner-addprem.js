let handler = async (m, { conn, text, usedPrefix, command }) => {
    let who
    let hari = 0

    // 1. REPLY PESAN
    if (m.quoted) {
        who = m.quoted.sender
        hari = parseInt(text.trim())
    }
    // 2. ADA TAG
    else if (m.mentionedJid?.length > 0) {
        who = m.mentionedJid[0]
        hari = parseInt(text.replace(/@[\d\w]+/g, '').trim())
    }
    // 3. LANGSUNG NOMOR + HARI
    else {
        let input = text.trim().split(/\s+/)
        if (input.length < 2) return m.reply(
`Cara pakai Bang:
${usedPrefix + command} @tag 30
${usedPrefix + command} 62895xxxx 365
Reply pesan + ${usedPrefix + command} 7

Contoh:
${usedPrefix + command} @62895323195263 999`.trim()
        )
        let nomor = input[0].replace(/[^0-9]/g, '')
        if (nomor.length < 10) return m.reply(`Nomor ga valid Bang :v`)
        who = nomor + '@s.whatsapp.net'
        hari = parseInt(input[1])
    }

    if (!hari || hari <= 0) return m.reply(`Masukin jumlah harinya Bang! Minimal 1 hari :v`)

    // Pastikan user ada
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = {
            limit: 10,
            premium: false,
            premiumTime: 0
        }
    }

    let user = global.db.data.users[who]
    let nama = await conn.getName(who)

    // Hitung expired (sekarang + hari)
    let sekarang = Date.now()
    let expired = sekarang + (hari * 24 * 60 * 60 * 1000)

    user.premium = true
    user.premiumTime = expired

    m.reply(
`Premium berhasil diaktifkan! 

User : @${who.split('@')[0]}
Nama : ${nama}
Masa aktif : ${hari} hari
Expired : ${new Date(expired).toLocaleDateString('id-ID')}
Status : ♾️ Unlimited limit sekarang!`.trim(),
null,
{ mentions: [who] }
    )
}

handler.help = ['addprem (@tag/nomor/reply) <hari>']
handler.tags = ['owner']
handler.command = /^(addprem|tambahprem|addpremium)$/i
handler.owner = true

export default handler
