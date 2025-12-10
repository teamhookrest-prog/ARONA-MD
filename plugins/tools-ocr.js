import { createWorker } from "tesseract.js"
import { fileTypeFromBuffer } from "file-type"

class TesseractOCR {
    constructor() {
        this.worker = null
    }

    async init() {
        if (!this.worker) {
            this.worker = await createWorker("eng")
        }
    }

    async recognize(buffer) {
        await this.init()
        const result = await this.worker.recognize(buffer)

        return {
            text: result.data.text.trim(),
            confidence: result.data.confidence,
        }
    }

    async stop() {
        if (this.worker) {
            await this.worker.terminate()
            this.worker = null
        }
    }
}

let ocrEngine = new TesseractOCR()

let handler = async (m, { usedPrefix, command }) => {
    try {
        let q = m.quoted || m
        let mime = q.mimetype || q.msg?.mimetype || ""

        if (!mime || !mime.startsWith("image/")) {
            return m.reply(
`Kirim atau reply gambar lalu ketik:

${usedPrefix + command}`
            )
        }

        let buffer = await q.download()
        const type = await fileTypeFromBuffer(buffer)

        if (!type) return m.reply("Media tidak valid.")

        m.reply("> Memproses OCR... Mohon tunggu.")

        const result = await ocrEngine.recognize(buffer)

        return m.reply(
`OCR Result

Confidence: ${result.confidence}%

Text:
${result.text || "(Kosong / tidak terbaca)"}
`
        )

    } catch (err) {
        console.error(err)
        return m.reply("Gagal melakukan OCR.")
    }
}

handler.help = ["ocr"]
handler.tags = ["tools"]
handler.command = /^ocr$/i

export default handler