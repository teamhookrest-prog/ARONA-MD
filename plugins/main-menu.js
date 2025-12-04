/* 
Warning! Warning!
Jangan di ganti cr ini bos
© danz-xyz + hookrest collab
api free : hookrest.my.id
owner : 62895323195263 [ Danz x Hookrest ]
*/

import { promises as fs } from 'fs';
import axios from 'axios';
import { toPTT } from '../function/converter.js';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tags = {
    'ai': 'Ai Menu',
    'main': 'Main Menu',
    'admin': 'Admin Menu',
    'group': 'Groups Menu',
    'maker': 'Maker Menu',
    'download': 'Downloader Menu',
    'islamic': 'Islam Menu',
    'khafa': 'Khafa Store Menu',
    'sticker': 'Sticker Menu',
    'tools': 'Tools Menu',
    'info': 'Info Menu',
    'internet': 'Internet Menu',
    'xp': 'Exp Menu',
    'random': 'Random Menu',
    'search': 'Search Menu',
    'owner': 'Owner Menu',
};

const defaultMenu = {
    before: `Hallo %name! 
Saya adalah Bot Otomatis yang siap membantu Anda 24/7!
 
*「  I N F O  B O T  」*
 •  *Mode :* %mode
 •  *Nama :* %me
 •  *Versi :* 1.0.8
 •  *Limit :* %limit
 •  *Uptime :* %uptime
 
*「  I N F O  S E R V E R  」*
 •  *Platform :* %platform
 •  *OS :* %serverOS
 •  *Arch :* %serverArch
 •  *CPU :* %cpuModel
 •  *RAM :* %freeMem / %totalMem
%readmore
`.trimStart(),
    header: '╭─「 *%category* 」',
    body: '│ • %cmd',
    footer: '╰────\n',
    after: `> © 2025 v.d`,
};

let handler = async (m, { conn, usedPrefix, command, text }) => {
    try {

        let user = global.db.data.users[m.sender] || {};
        let name = `@${m.sender.split('@')[0]}`;
        let botname = conn.user?.name || "Hookrest Bot";

        let limit = user?.premiumTime > 0 
            ? '♾️ Unlimited' 
            : `${user?.limit ?? 10} limit`;

        const d = new Date(new Date().getTime() + 7 * 3600 * 1000);
        const locale = 'id-ID';
        const year = d.toLocaleDateString(locale, { year: 'numeric' });

        let uptime = clockString(process.uptime() * 1000);
        let mode = global.opts['self'] ? 'Private' : 'Publik';
        let platform = os.platform();
        let cpuModel = os.cpus()[0]?.model.trim() || 'Unknown CPU';
        let totalMem = formatBytes(os.totalmem());
        let freeMem = formatBytes(os.freemem());
        let serverArch = os.arch();
        let serverOS = os.release();

        let _package = {};
        try {
            const pkgPath = path.join(__dirname, '../package.json');
            _package = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
        } catch {}

        let help = Object.values(global.plugins)
            .filter(plugin => !plugin.disabled)
            .map(plugin => ({
                help: Array.isArray(plugin.help) ? plugin.help : [plugin.help || ''],
                tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags || ''],
                prefix: 'customPrefix' in plugin,
                limit: !!plugin.limit,
                premium: !!plugin.premium,
            }));

        for (let plugin of help) {
            for (let tag of plugin.tags) {
                if (!(tag in tags)) tags[tag] = tag;
            }
        }

        const readMore = String.fromCharCode(8206).repeat(4001);
        let replace = {
            '%': '%', p: usedPrefix, name, limit, uptime, mode, me: botname,
            version: _package.version || '1.0.8',
            platform, serverOS, serverArch, cpuModel,
            totalMem, freeMem, readmore: readMore
        };

        let menuType = text?.toLowerCase().trim() || '';
        let menuText = [];
        let { before, header, body, footer, after } = defaultMenu;

        if (!menuType) {
            let tagList = Object.keys(tags).map(tag => `│ • \`${usedPrefix + command} ${tag}\``).join('\n');
            menuText = [
                before.replace(/%([a-zA-Z0-9]+)/g, (_, k) => replace[k] || _),
                `Daftar Menu Tersedia:`,
                `╭─「 *DAFTAR MENU* 」`,
                `│ • \`${usedPrefix + command} all\``,
                tagList,
                `╰────\n`,
                `Ketik \`${usedPrefix + command} <menu>\` untuk detail.`,
                `*Contoh:* \`${usedPrefix + command} ai\``,
                `\n` + after
            ];
        } else if (menuType === 'all' || tags[menuType]) {
            menuText.push(before.replace(/%([a-zA-Z0-9]+)/g, (_, k) => replace[k] || _));

            let categories = menuType === 'all' ? Object.keys(tags) : [menuType];
            for (let tag of categories) {
                let filtered = help.filter(h => h.tags.includes(tag) && h.help[0]);
                if (!filtered.length) continue;

                menuText.push(header.replace(/%category/g, tags[tag]));
                filtered.forEach(plugin => {
                    plugin.help.forEach(cmd => {
                        let prefix = plugin.prefix ? '' : usedPrefix;
                        let premium = plugin.premium ? ' (Premium)' : '';
                        let limitTag = plugin.limit ? ' (Limit)' : '';
                        menuText.push(body.replace(/%cmd/g, prefix + cmd + premium + limitTag));
                    });
                });
                menuText.push(footer);
            }
            menuText.push(after);
        }

        let finalText = menuText.join('\n').replace(/%([a-zA-Z0-9]+)/g, (_, k) => replace[k] || _);

        // ============ SEND MENU FIRST ============
        await conn.sendMessage(m.chat, {
            text: finalText,
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: `${botname} © ${year}`,
                    body: `Uptime: ${uptime}`,
                    thumbnailUrl: global.thum || '',
                    sourceUrl: global.lgc || '',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

        // ============ DELAY + SEND AUDIO ============
        if (global.audio) {
            await new Promise(resolve => setTimeout(resolve, 900)); // delay 0.9 detik

            try {
                const buffer = (await axios.get(global.audio, { responseType: 'arraybuffer' })).data;
                const { data: audioPTT } = await toPTT(buffer, 'mp3');

                await conn.sendMessage(m.chat, {
                    audio: audioPTT,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: m });
            } catch (e) {
                console.error("Audio menu error:", e);
            }
        }

    } catch (e) {
        console.error(e);
        m.reply('Menu error Bang, coba lagi nanti :v');
    }
};

handler.command = /^(menu|help|perintah)$/i;
handler.tags = ['main'];
handler.help = ['menu', 'help'];
export default handler;


// ======================================
function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${['Bytes','KB','MB','GB','TB'][i]}`;
}
