let handler = async (m, { conn, text }) => {
    let who
    
    if (m.quoted) {
        who = m.quoted.sender
    } else if (text && text.includes('@')) {
        who = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    } else {
        who = m.sender
    }

    let user = global.db.data.users[who]
    
    if (!user) {
        return m.reply(`User ${who} tidak ditemukan di database`)
    }
    
    let debugInfo = `
🔍 DEBUG LIMIT INFO

User: @${who.split('@')[0]}
Nama: ${user.name || 'Unknown'}
Limit value: ${user.limit}
Limit type: ${typeof user.limit}
Premium status: ${user.premium ? 'true' : 'false'}
Premium time: ${user.premiumTime}
Premium active: ${user.premium && user.premiumTime > Date.now() ? 'YES' : 'NO'}
Current time: ${Date.now()}

Is limit -1? ${user.limit === -1}
Is limit Infinity? ${user.limit === Infinity}

Database data:
${JSON.stringify(user, null, 2)}
    `.trim()
    
    conn.sendMessage(m.chat, { 
        text: debugInfo,
        mentions: [who]
    }, { quoted: m })
}

handler.help = ['debuglimit @user']
handler.tags = ['owner']
handler.command = /^(debuglimit|cekl)$/i
handler.owner = true

export default handler