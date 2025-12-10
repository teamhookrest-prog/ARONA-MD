import axios from "axios";

class YouTubeDownloader {
  static FORMATS = {
    mp3: "MP3 (Audio Only)",
    144: "144p",
    240: "240p",
    360: "360p",
    480: "480p",
    720: "720p (HD)",
    1080: "1080p (Full HD)"
  };

  static API_URL = "https://host.optikl.ink/download/youtube";

  static async fetchVideoInfo(url, format) {
    const fmt = format.toLowerCase();
    const { data } = await axios.get(this.API_URL, {
      params: { url, format: fmt },
      timeout: 60000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!data.status || data.code !== 200) throw new Error(data.message || "Gagal mengambil info video");

    const r = data.result;
    return {
      title: r.title || "Tanpa Judul",
      duration: this.formatDuration(r.duration),
      thumbnail: r.thumbnail,
      quality: r.quality || fmt.toUpperCase(),
      downloadUrl: r.download,
      type: fmt === "mp3" ? "audio" : "video",
      ext: fmt === "mp3" ? "mp3" : "mp4"
    };
  }

  static formatDuration(seconds) {
    if (!seconds) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`
      : `${m}:${s.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  }
}

const ytdlSession = {};

let handler = async (m, { conn, text, usedPrefix }) => {
  const user = m.sender;

  try { 
    await conn.sendMessage(m.chat, { react: { text: "⚡", key: m.key } }) 
  } catch {}

  if (!text) return m.reply(`Gunakan:\n${usedPrefix}ytdl <link youtube>`);

  if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(text)) {
    return m.reply("Link YouTube tidak valid!");
  }

  const listText = Object.entries(YouTubeDownloader.FORMATS)
    .map(([k,v]) => `${k} → ${v}`).join("\n");

  const msg = await m.reply(`Pilih format untuk download:\n\n${listText}\n\nKetik format format yang diinginkan _( jangan di reply )_`);

  ytdlSession[m.chat] = { link: text, msg };
};

handler.before = async (m, { conn }) => {
  const session = ytdlSession[m.chat];
  if (!session) return;

  if (m.quoted?.id !== session.msg.id) return;

  const format = m.text.toLowerCase();
  if (!YouTubeDownloader.FORMATS[format]) return;

  await m.reply("Sedang memproses download, sabar ya...");

  try {
    const info = await YouTubeDownloader.fetchVideoInfo(session.link, format);
    let thumb = null;
    if (info.thumbnail) {
      try {
        const res = await axios.get(info.thumbnail, { responseType: "arraybuffer", timeout: 10000 });
        thumb = Buffer.from(res.data);
      } catch {}
    }

    if (info.type === "audio") {
      await conn.sendMessage(m.chat, {
        audio: { url: info.downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${info.title}.mp3`,
        caption: `Judul: ${info.title}\nDurasi: ${info.duration}\nKualitas: ${info.quality}`
      }, { quoted: m });
    } else {
      await conn.sendMessage(m.chat, {
        video: { url: info.downloadUrl },
        mimetype: "video/mp4",
        caption: `Judul: ${info.title}\nDurasi: ${info.duration}\nKualitas: ${info.quality}`,
        jpegThumbnail: thumb
      }, { quoted: m });
    }

  } catch (e) {
    console.log(e);
    m.reply(`Gagal download!\n${e.message}`);
  }

  delete ytdlSession[m.chat];
};

handler.help = ["ytdl <link>"];
handler.tags = ["download"];
handler.command = /^ytdl$/i;
handler.limit = true;

export default handler;