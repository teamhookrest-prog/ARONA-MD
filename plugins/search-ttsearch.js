import axios from "axios";
import FormData from "form-data";

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply("❌ Masukkan URL atau kata kunci TikTok.");

    try {
        m.reply("⏳ Sedang mencari dan mendownload video TikTok...");

        let videoData;

        if (/tiktok.com/.test(text)) {
            // Download langsung dari TikWM
            const form = new FormData();
            form.append("url", text);
            form.append("count", 50);
            form.append("cursor", 0);
            form.append("web", 1);
            form.append("hd", 2);

            const { data: response } = await axios.post("https://tikwm.com/api/", form, {
                headers: form.getHeaders()
            });

            const v = response?.data;
            videoData = {
                title: v?.title || "TikTok Video",
                author: v?.author?.nickname || "Unknown",
                video_url: v?.hdplay ? "https://tikwm.com" + v.hdplay : "https://tikwm.com" + v.play
            };
        } else {
            // Cari video berdasarkan kata kunci
            const form = new FormData();
            form.append("keywords", text);
            form.append("count", 50);
            form.append("cursor", 0);
            form.append("web", 1);
            form.append("hd", 2);

            const { data: res } = await axios.post("https://tikwm.com/api/feed/search", form, {
                headers: form.getHeaders()
            });

            const firstVideo = res?.data?.videos?.[0];
            if (!firstVideo) return m.reply("❌ Video tidak ditemukan.");

            videoData = {
                title: firstVideo.title || "TikTok Video",
                author: firstVideo.author?.nickname || "Unknown",
                video_url: "https://tikwm.com" + firstVideo.play
            };
        }

        // Download video sebagai Buffer
        const videoBuffer = await axios.get(videoData.video_url, { responseType: "arraybuffer" });

        // Buat caption dari info
        const caption = `🎬 ${videoData.title}\n👤 ${videoData.author}`;

        // Kirim video langsung ke chat dengan caption
        await conn.sendFile(m.chat, Buffer.from(videoBuffer.data), "tiktok.mp4", caption, m);

    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mendownload video TikTok.");
    }
};

handler.help = ["ttsearch <url/kata kunci>"];
handler.tags = ["search"];
handler.command = /^ttsearch$/i;

export default handler;