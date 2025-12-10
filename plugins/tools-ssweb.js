import axios from "axios"
import { fileTypeFromBuffer } from "file-type"

const DEVICE_PRESET = {
    desktop: { w: 1920, h: 1080 },
    mobile: { w: 375, h: 812 },
    tablet: { w: 768, h: 1024 }
}

async function generateScreenshot(url, device, format) {
    let width = 1280, height = 1024

    // Apply preset device jika ada
    if (DEVICE_PRESET[device]) {
        width = DEVICE_PRESET[device].w
        height = DEVICE_PRESET[device].h
    }

    try {
        const params = {
            tkn: "125",
            d: 2000,
            u: encodeURIComponent(url),
            fs: 0,
            w: width,
            h: height,
            f: format || "jpg",
            rt: "jweb"
        }

        const res = await axios.get("https://api.pikwy.com/", {
            params,
            responseType: "arraybuffer"
        })

        const json = JSON.parse(res.data.toString())
        if (json.code) return { error: true, msg: json.mesg }

        const img = await axios({
            url: json.durl,
            method: "GET",
            responseType: "arraybuffer"
        })

        return {
            buffer: Buffer.from(img.data),
            info: json
        }

    } catch (err) {
        return { error: true, msg: err.message }
    }
}

export default async function handler(m, { conn, args }) {
    if (!args[0]) return m.reply(`⚠️ Contoh penggunaan:\n\n*.ss https://google.com mobile png*`)

    const url = args[0]
    const device = args[1]?.toLowerCase() || "desktop"
    const format = args[2]?.toLowerCase() || "jpg"

    if (!/^https?:\/\//.test(url)) return m.reply("❌ URL tidak valid!")

    if (args[1] && !DEVICE_PRESET[device]) {
        return m.reply(`❌ Device tidak dikenal!\n\nDevice tersedia:\n- desktop\n- mobile\n- tablet`)
    }

    m.reply("🛠️ Mengambil screenshot...")

    const result = await generateScreenshot(url, device, format)

    if (result.error) return m.reply(`❌ Error: ${result.msg}`)

    const buffer = result.buffer
    const ftype = await fileTypeFromBuffer(buffer)

    await conn.sendMessage(m.chat, {
        image: buffer,
        caption: `📸 *Screenshot Complete*\n\n🌐 URL: ${url}\n📱 Mode: ${device}\n🖼 Format: ${ftype?.ext || "jpg"}\n🕑 Time: ${result.info.date}`
    }, { quoted: m })
}

handler.help = ["ss", "screenshot"]
handler.tags = ["tools"]
handler.command = /^ss|screenshot$/i
handler.limit = true