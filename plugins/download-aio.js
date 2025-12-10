import axios from 'axios';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';

async function ddownr(url, format = '1080') {
    try {
        const downloadResponse = await axios({
            method: 'GET',
            url: 'https://p.savenow.to/ajax/download.php',
            params: {
                copyright: '0',
                format: format,
                url: url,
                api: 'dfcb6d76f2f6a9894gjkege8a4ab232222'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': '*/*',
                'Referer': 'https://ddownr.com/',
                'Origin': 'https://ddownr.com'
            }
        });

        const downloadId = downloadResponse.data.id || downloadResponse.data.download_id;
        const videoInfo = downloadResponse.data.info;

        if (!downloadId) throw new Error('No download ID received');

        let attempts = 0;
        const maxAttempts = 30;
        const pollInterval = 2000;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const progressResponse = await axios({
                method: 'GET',
                url: `https://p.savenow.to/api/progress`,
                params: { id: downloadId },
                headers: downloadResponse.config.headers
            });

            const data = progressResponse.data;

            if (data.success || data.download_url || data.status === 'finished') {
                return {
                    title: videoInfo?.title || 'Unknown',
                    thumbnail: videoInfo?.image || '',
                    download_url: data.download_url,
                    alternative_urls: data.alternative_download_urls || []
                };
            }

            if (data.error || data.status === 'error') {
                throw new Error(data.error || 'Gagal woyy');
            }

            attempts++;
        }

        throw new Error('Timeout: kelamaan jirr');

    } catch (error) {
        throw error;
    }
}

// ================= PLUGIN WA =================

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply('❌ Kirim link YouTube/TikTok/IG yang ingin di-download!');

    m.reply('⏳ Sedang memproses, tunggu sebentar...');

    try {
        const quality = '1080';
        const result = await ddownr(text, quality);

        // Download file sementara
        const tmpFile = join(tmpdir(), `${Date.now()}.${result.download_url.endsWith('.m4a') ? 'm4a' : 'mp4'}`);
        const fileResp = await axios.get(result.download_url, { responseType: 'arraybuffer' });
        await fs.writeFile(tmpFile, fileResp.data);

        // Kirim ke chat sesuai tipe file
        if (tmpFile.endsWith('.m4a')) {
            await conn.sendMessage(m.chat, { audio: { url: tmpFile }, mimetype: 'audio/m4a', fileName: result.title + '.m4a' }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { video: { url: tmpFile }, caption: result.title, fileName: result.title + '.mp4' }, { quoted: m });
        }

        // Hapus file sementara
        await fs.unlink(tmpFile);

    } catch (err) {
        console.error(err);
        m.reply('❌ Gagal download, coba lagi nanti.');
    }
};

handler.help = ['aio <link>'];
handler.tags = ['download'];
handler.command = /^aio$/i;
handler.limit = true;
handler.premium = false;

export default handler;