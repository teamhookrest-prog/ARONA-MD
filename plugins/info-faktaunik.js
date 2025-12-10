import axios from 'axios'
import { load } from 'cheerio'

let handler = async (m, { conn }) => {
    await m.reply('Sedang mengambil 10 fakta unik dunia...')

    try {
        const { data } = await axios.get('https://mercusuar.ac.id/10-fakta-unik-dunia', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
            },
            timeout: 15000
        })

        const $ = load(data)
        const fakta = []

        $('.entry-content ol li').each((i, el) => {
            let teks = $(el).text().trim()
            teks = teks.replace(/^\d+\.\s*/, '').trim()
            if (teks) fakta.push((i + 1) + '. ' + teks)
        })

        if (fakta.length === 0) throw 'Tidak ada fakta ditemukan'

        const result = '10 FAKTA UNIK DUNIA\n\n' + fakta.join('\n\n') + '\n\nSumber: mercusuar.ac.id'

        await m.reply(result)

    } catch (e) {
        m.reply('Gagal mengambil fakta. Website sedang down atau struktur berubah.')
    }
}

handler.help = ['faktaunik', 'fakta', 'fact']
handler.tags = ['info']
handler.command = /^(faktaunik|fakta|fact|facts)$/i

export default handler