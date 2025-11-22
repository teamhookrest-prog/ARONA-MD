import didyoumean from 'didyoumean'
import similarity from 'similarity'

let handler = m => m

handler.before = function (m, { match }) {
  let prefix = (match[0] || '')[0]
  if (!prefix) return

  let noPrefix = m.text.replace(prefix, '').trim()
  let args = noPrefix.trim().split(' ').slice(1)

  let alias = Object.values(global.plugins)
    .filter(v => v.help && !v.disabled)
    .map(v => v.help)
    .flat(1)

  if (alias.includes(noPrefix)) return

  let mean = didyoumean(noPrefix, alias)
  if (!mean) return

  let sim = similarity(noPrefix, mean)
  let percent = parseInt(sim * 100)

  let text = `
• Halo Kak @${m.sender.split('@')[0]}  
Apakah Anda sedang mencari *${prefix + mean}* ?

◦ Nama menu: *${prefix + mean}*  
◦ Kemiripan: *${percent}%*
`

  this.relayMessage(m.chat, {
    requestPaymentMessage: {
      currencyCodeIso4217: 'IDR',
      requestFrom: '0@s.whatsapp.net',
      noteMessage: {
        extendedTextMessage: {
          text,
          contextInfo: {
            mentionedJid: [m.sender],
            externalAdReply: { showAdAttribution: false }
          }
        }
      }
    }
  }, {})
}

export default handler