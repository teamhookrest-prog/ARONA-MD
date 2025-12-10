import { promises as fs } from 'fs'
import axios from 'axios'
import { toPTT } from '../function/converter.js'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let tags = {
    ai: 'Ai Menu',
    main: 'Main Menu',
    admin: 'Admin Menu',
    group: 'Groups Menu',
    maker: 'Maker Menu',
    download: 'Downloader Menu',
    islamic: 'Islam Menu',
    khafa: 'Khafa Store Menu',
    sticker: 'Sticker Menu',
    tools: 'Tools Menu',
    info: 'Info Menu',
    internet: 'Internet Menu',
    xp: 'Exp Menu',
    random: 'Random Menu',
    search: 'Search Menu',
    owner: 'Owner Menu'
}

const defaultMenu = {
    before: `> ╾─「 SYSTEM INFO 」
> Name    : %me
> Mode    : %mode
> Limit   : %limit
> Uptime  : %uptime
> Platform: %platform
> OS      : %serverOS
> Arch    : %serverArch
> CPU     : %cpuModel
> RAM     : %freeMem / %totalMem
> ╾───────────╼\n`,
    header: '> ╾─「 *%category* 」',
    body: '> %cmd',
    footer: '> ╾──────────╼\n',
    after: '> © 2025 v.d'
}

let handler = async (m, { conn, usedPrefix, command, text }) => {
    try {
        let user = global.db.data.users[m.sender] || {}
        let botname = conn.user?.name || 'Hookrest Bot'
        let limit = user?.premiumTime > 0 ? 'Unlimited' : `${user?.limit ?? 10} limit`

        const d = new Date(new Date().getTime() + 7 * 3600 * 1000)
        const year = d.toLocaleDateString('id-ID', { year: 'numeric' })

        let uptime = clockString(process.uptime() * 1000)
        let mode = global.opts['self'] ? 'Private' : 'Publik'
        let platform = os.platform()
        let cpuModel = os.cpus()[0]?.model?.trim() || 'Unknown CPU'
        let totalMem = formatBytes(os.totalmem())
        let freeMem = formatBytes(os.freemem())
        let serverArch = os.arch()
        let serverOS = os.release()

        let _package = {}
        try {
            const pkgPath = path.join(__dirname, '../package.json')
            _package = JSON.parse(await fs.readFile(pkgPath, 'utf8'))
        } catch {}

        let help = Object.values(global.plugins || {})
            .filter(p => !p.disabled)
            .map(plugin => {
                let helpArr = Array.isArray(plugin.help) ? plugin.help : plugin.help ? [plugin.help] : []
                let tagsArr = Array.isArray(plugin.tags) ? plugin.tags : plugin.tags ? [plugin.tags] : []
                return {
                    help: helpArr.map(h => h.toString().trim()).filter(Boolean),
                    tags: tagsArr.map(t => t.toString().trim()).filter(Boolean),
                    prefix: 'customPrefix' in plugin,
                    limit: !!plugin.limit,
                    premium: !!plugin.premium
                }
            })
            .filter(p => p.help.length > 0 && p.tags.length > 0)

        for (let plugin of help) {
            for (let tag of plugin.tags) {
                if (tag && !(tag in tags)) tags[tag] = tag
            }
        }

        let replace = {
            '%': '%', p: usedPrefix, name: `@${m.sender.split('@')[0]}`, limit, uptime, mode,
            me: botname,
            version: _package.version || '1.0.8',
            platform, serverOS, serverArch, cpuModel,
            totalMem, freeMem,
        }

        let menuType = (text || '').toLowerCase().trim()
        let menuText = []
        let { before, header, body, footer, after } = defaultMenu

        if (!menuType) {
            let filteredTags = Object.keys(tags).filter(tag => tag && help.some(h => h.tags.includes(tag)))
            let tagList = filteredTags.map(tag => `│ \`${usedPrefix + command} ${tag}\``).join('\n')

            menuText = [
                before.replace(/%([a-zA-Z0-9]+)/g, (_, k) => replace[k] || _),
                '╭─「 AVAILABLE MENUS 」',
                `│ \`${usedPrefix + command} all\``,
                tagList || '',
                '╰─────────────',
                `Type \`${usedPrefix + command} <menu>\` to view commands`,
                `Example: \`${usedPrefix + command} ai\``,
                `\n${after}`
            ]
        } else if (menuType === 'all' || (menuType && menuType in tags)) {
            menuText.push(before.replace(/%([a-zA-Z0-9]+)/g, (_, k) => replace[k] || _))
            let categories = menuType === 'all'
                ? Object.keys(tags).filter(t => t && help.some(h => h.tags.includes(t)))
                : [menuType]

            for (let tag of categories) {
                let filtered = help.filter(h => h.tags.includes(tag))
                if (!filtered.length) continue

                menuText.push(header.replace(/%category/g, tags[tag]))

                filtered.forEach(plugin => {
                    plugin.help.forEach(cmd => {
                        let prefix = plugin.prefix ? '' : usedPrefix
                        let premium = plugin.premium ? ' (Premium)' : ''
                        let limitTag = plugin.limit ? ' (Limit)' : ''
                        menuText.push(body.replace(/%cmd/g, prefix + cmd + premium + limitTag))
                    })
                })

                menuText.push(footer)
            }

            menuText.push(after)
        } else {
            menuText = [
                before.replace(/%([a-zA-Z0-9]+)/g, (_, k) => replace[k] || _),
                `Menu "${menuType}" tidak ditemukan.`,
                `Use \`${usedPrefix + command} all\` to see all menus.`,
                `\n${after}`
            ]
        }

        let finalText = menuText.join('\n').replace(/%([a-zA-Z0-9]+)/g, (_, k) => replace[k] || _)

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
        }, { quoted: m })

        if (global.audio) {
            await new Promise(resolve => setTimeout(resolve, 900))
            try {
                const buffer = (await axios.get(global.audio, { responseType: 'arraybuffer' })).data
                const { data: audioPTT } = await toPTT(buffer, 'mp3')

                await conn.sendMessage(m.chat, {
                    audio: audioPTT,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: m })
            } catch {}
        }

    } catch (e) {
        console.error(e)
        m.reply('Menu error, coba lagi nanti.')
    }
}

handler.command = /^(menu|help|perintah)$/i
handler.tags = ['main']
handler.help = ['menu', 'help']
export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${['Bytes','KB','MB','GB','TB'][i]}`
}
