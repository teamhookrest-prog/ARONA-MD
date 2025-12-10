import fetch from "node-fetch"

class ImgEditor {
  static base = "https://imgeditor.co/api"

  static async getUploadUrl(buffer) {
    const res = await fetch(`${this.base}/get-upload-url`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "photo.jpg",
        contentType: "image/jpeg",
        fileSize: buffer.length
      })
    })
    return res.json()
  }

  static async upload(uploadUrl, buffer) {
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      body: buffer
    })
  }

  static async generate(prompt, imageUrl) {
    const res = await fetch(`${this.base}/generate-image`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prompt,
        styleId: "realistic",
        mode: "image",
        imageUrl,
        imageUrls: [imageUrl],
        numImages: 1,
        outputFormat: "png",
        model: "nano-banana"
      })
    })
    return res.json()
  }

  static async check(taskId) {
    while (true) {
      await new Promise(r => setTimeout(r, 2500))
      const res = await fetch(`${this.base}/generate-image/status?taskId=${taskId}`)
      const json = await res.json()
      if (json.status === "completed") return json.imageUrl
      if (json.status === "failed") throw new Error("Task failed")
    }
  }
}

let handler = async (m, { conn, text }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ""
  
  if (!/image/.test(mime)) return m.reply("Balas/kirim foto dengan caption .edit <prompt>")
  if (!text) return m.reply("Prompt nya mana?\nContoh: .edit jadi anime cowok")

  const prompt = text.trim()
  const wait = await conn.sendMessage(m.chat, { text: "Download foto..." }, { quoted: m })

  let buffer
  try {
    buffer = await q.download()
    if (!buffer) throw ""
  } catch {
    return conn.sendMessage(m.chat, { edit: wait.key, text: "Gagal download foto!" })
  }

  await conn.sendMessage(m.chat, { edit: wait.key, text: "Upload foto..." })

  try {
    const up = await ImgEditor.getUploadUrl(buffer)
    await ImgEditor.upload(up.uploadUrl, buffer)

    await conn.sendMessage(m.chat, { edit: wait.key, text: "Generate AI (bisa 20-50 detik)..." })

    const task = await ImgEditor.generate(prompt, up.publicUrl)
    const resultUrl = await ImgEditor.check(task.taskId)

    await conn.sendMessage(m.chat, {
      image: { url: resultUrl },
      caption: `Selesai!\nPrompt: ${prompt}`
    }, { quoted: m })

    await conn.sendMessage(m.chat, { delete: wait.key })

  } catch (e) {
    console.log(e)
    await conn.sendMessage(m.chat, { edit: wait.key, text: "Gagal proses gambar. Coba lagi nanti." })
  }
}

handler.help = ["edit <prompt>"]
handler.tags = ["ai"]
handler.command = /^(edit|aiimg|imgedit)$/i
handler.limit = true

export default handler