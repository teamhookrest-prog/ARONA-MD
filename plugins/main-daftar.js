let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]

    // Kalau sudah daftar
    if (user.register) {
        return m.reply(`Kamu sudah terdaftar!\n\nNama: ${user.name}\nUmur: ${user.age} tahun\nLevel: ${user.level}\nExp: ${user.exp}`)
    }

    // Cek format
    if (!text) return m.reply(`Gunakan format:\n${usedPrefix + command} nama.umur\n\nContoh: ${usedPrefix + command} Hookrest.19`)

    let [nama, umur] = text.split`.`
    if (!nama) return m.reply(`Nama tidak boleh kosong!\nContoh: ${usedPrefix + command} Hookrest.19`)
    if (!umur) return m.reply(`Umur tidak boleh kosong!\nContoh: ${usedPrefix + command} Hookrest.19`)
    umur = parseInt(umur)
    if (isNaN(umur)) return m.reply(`Umur harus angka!\nContoh: ${usedPrefix + command} Hookrest.19`)
    if (umur < 10) return m.reply(`Umur minimal 10 tahun!`)
    if (umur > 70) return m.reply(`Umur maksimal 70 tahun! Jangan bohong umur dong`)
    if (nama.length > 25) return m.reply(`Nama terlalu panjang! Maksimal 25 huruf`)

    nama = nama.trim()

    // Simpan data
    user.name = nama
    user.age = umur
    user.register = true
    user.regTime = Date.now()

    // Kirim pesan sukses
    let caption = `
PENDAFTARAN BERHASIL!

Nama: ${nama}
Umur: ${umur} tahun
Status: Terdaftar

Sekarang kamu bisa naik level & pakai semua fitur bot!
Ketik .profile atau .me untuk lihat status kamu
    `.trim()

    let pp
    try {
        pp = await conn.profilePictureUrl(m.sender, 'image')
    } catch {
        pp = 'https://telegra.ph/file/4d1e7c7d5d29f5b7e7c99.jpg'
    }

    await conn.sendMessage(m.chat, {
        image: { url: pp },
        caption: caption,
        mentions: [m.sender]
    }, { quoted: m })

    // Bonus exp pertama kali daftar
    user.exp += 50
    m.reply(`+50 Exp (bonus daftar pertama kali!)`)
}

handler.help = ['daftar nama.umur']
handler.tags = ['main']
handler.command = /^(daftar|register)$/i
handler.register = false

export default handler