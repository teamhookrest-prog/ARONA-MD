import vm from 'vm'
import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`ᴋɪʀɪᴍ ᴄᴏᴅᴇ sᴄʀᴀᴘᴇʀɴʏᴀ ʏᴜᴋ ♡\n\nᴄᴏɴᴛᴏʜ:\n${usedPrefix + command} const axios = require('axios');\nconst res = await axios.get('https://api.quotable.io/random');\nreturn res.data`)

    const code = text.trim()

    // Validasi biar aman (hanya boleh return data / console.log
    if (!code.includes('return') && !code.includes('console.log')) {
        return m.reply('ᴄᴏᴅᴇ ʜᴀʀᴜs ᴍᴇɴɢᴀɴᴅᴜɴɢ *return* ᴀᴛᴀᴜ *console.log* ʏᴀ ♡')
    }

    await m.reply('sᴇᴅᴀɴɢ ᴍᴇɴɢᴇᴋsᴇᴋᴜsɪ ᴄᴏᴅᴇ...\nᴛᴜɴɢɢᴜ sᴇʙᴇɴᴛᴀʀ ♡')

    try {
        // Sandbox aman
        const sandbox = {
            axios,
            require: () => { throw new Error('require diblokir') },
            console: {
                log: (...args) => { result = args.join(' ') }
            },
            result: null,
            module: {},
            exports: {}
        }

        // Ubah code jadi async function
        const wrappedCode = `
            (async () => {
                try {
                    ${code}
                } catch (e) {
                    return { error: e.message }
                }
            })()
        `

        const script = new vm.Script(wrappedCode)
        const context = vm.createContext(sandbox)
        const resultPromise = script.runInContext(context, { timeout: 8000 })

        // Jalankan & tangkap hasil
        const output = await resultPromise

        // Ambil hasil
        let finalResult = sandbox.result || output

        // Kalau hasilnya JSON, tampilkan rapi
        if (typeof finalResult === 'object' && finalResult !== null) {
            finalResult = JSON.stringify(finalResult, null, 2)
        } else if (typeof finalResult === 'string') {
            finalResult = finalResult.trim()
        } else if (finalResult === undefined || finalResult === null) {
            finalResult = 'Tidak ada output (mungkin lupa return?)'
        }

        // Kirim hasil dalam format code block
        await m.reply(`*HASIL SCRAPER* ♡\n\n\`\`\`json\n${finalResult}\n\`\`\``)

    } catch (e) {
        console.log(e)
        m.reply(`ɢᴀɢᴀʟ ᴍᴇɴɢᴇᴋsᴇᴋᴜsɪ ᴄᴏᴅᴇ :(\n\nᴇʀʀᴏʀ:\n\`\`\`${e.message}\`\`\``)
    }
}

handler.help = ['scraper <kode js>']
handler.tags = ['owner', 'tools']
handler.command = /^scraper$/i
handler.owner = true

export default handler