/* 
Warning! Warning!
Jangan di ganti cr ini bos
© danz-xyz + Hookrest
api free : hookrest.my.id
owner : 62895323195263 [ Danz × Hookrest ]
*/

import "./settings.js";
import { smsg } from "./function/simple.js";
import { fileURLToPath } from "url";
import path from "path";
import { format } from "util";
import { unwatchFile, watchFile } from "fs";
import chalk from "chalk";
import { jidNormalizedUser } from "baileys";

const isNumber = x => typeof x === "number" && !isNaN(x);
const printMessages = (await import("./function/print.js")).default;

// RATE LIMIT PROTECTION SYSTEM
class RateLimitProtection {
    constructor() {
        this.lastRequests = new Map();
        this.blockedUntil = new Map();
        this.requestCounts = new Map();
        
        this.MIN_DELAY = 2500;
        this.GROUP_METADATA_DELAY = 4000;
        this.MAX_REQUESTS_PER_MINUTE = 20;
        this.RETRY_DELAY = 10000;
    }

    async waitIfNeeded(jid, type = 'message') {
        const key = `${jid}_${type}`;
        const now = Date.now();
        
        if (this.blockedUntil.has(key)) {
            const blockedTime = this.blockedUntil.get(key);
            if (now < blockedTime) {
                const waitTime = blockedTime - now;
                await this.delay(waitTime);
            } else {
                this.blockedUntil.delete(key);
            }
        }
        
        const minuteKey = `${jid}_${Math.floor(now / 60000)}`;
        let count = this.requestCounts.get(minuteKey) || 0;
        
        if (count >= this.MAX_REQUESTS_PER_MINUTE) {
            await this.delay(this.RETRY_DELAY);
            this.requestCounts.delete(minuteKey);
        }
        
        this.requestCounts.set(minuteKey, count + 1);
        
        const cleanupTime = now - 120000;
        for (const [key, timestamp] of Array.from(this.requestCounts.entries())) {
            const keyTime = parseInt(key.split('_')[1]) * 60000;
            if (keyTime < cleanupTime) {
                this.requestCounts.delete(key);
            }
        }
        
        const lastRequest = this.lastRequests.get(key) || 0;
        if (lastRequest > 0) {
            const timeSinceLast = now - lastRequest;
            const requiredDelay = type === 'metadata' ? this.GROUP_METADATA_DELAY : this.MIN_DELAY;
            
            if (timeSinceLast < requiredDelay) {
                const waitTime = requiredDelay - timeSinceLast + Math.random() * 1000;
                await this.delay(waitTime);
            }
        }
        
        this.lastRequests.set(key, now);
    }

    markAsRateLimited(jid, type = 'message') {
        const key = `${jid}_${type}`;
        const blockTime = Date.now() + this.RETRY_DELAY;
        this.blockedUntil.set(key, blockTime);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const rateProtector = new RateLimitProtection();

function getBotJid(conn) {
    if (!conn || !conn.user) return "";
    if (conn.user.id) return jidNormalizedUser(conn.user.id);
    if (conn.user.jid) return conn.user.jid;
    return "";
}

// AUTO RESET LIMIT HANYA UNTUK USER BIASA (PREMIUM DI-SKIP)
function dailyLimitReset() {
    if (!global.db?.data) return;

    const now = new Date();
    const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const today = wib.getDate();

    if (!global.db.data.settings) global.db.data.settings = {};
    if (global.db.data.settings.lastLimitReset === today) return;

    console.log(chalk.cyanBright(`[AUTO RESET] Reset limit user biasa — ${wib.toLocaleDateString("id-ID")}`));

    for (let jid in global.db.data.users) {
        const user = global.db.data.users[jid];
        if (!user) continue;
        
        const isPremiumActive = user.premium && user.premiumTime > Date.now();
        if (!isPremiumActive && typeof user.limit === "number") {
            if (user.limit !== Infinity && user.limit !== -1) {
                user.limit = 10;
            }
        }
    }

    global.db.data.settings.lastLimitReset = today;
    global.db.saveDatabase?.();
}

setInterval(dailyLimitReset, 60_000);

// FUNGSI SEND MESSAGE DENGAN RATE LIMIT PROTECTION (PENTING!)
async function sendMessageSafe(conn, jid, content, options = {}) {
    try {
        await rateProtector.waitIfNeeded(jid, 'message');
        const result = await conn.sendMessage(jid, content, options);
        await rateProtector.delay(1500);
        return result;
    } catch (error) {
        console.error('[SEND MESSAGE ERROR]', error);
        
        if (error.message?.includes('rate-overlimit') || error.message?.includes('429') || error.data === 429) {
            rateProtector.markAsRateLimited(jid, 'message');
            await rateProtector.delay(rateProtector.RETRY_DELAY);
            
            try {
                return await conn.sendMessage(jid, content, options);
            } catch (retryError) {
                throw retryError;
            }
        }
        throw error;
    }
}

// FUNGSI REPLY DENGAN PROTECTION
async function replySafe(conn, jid, text, quoted, options = {}) {
    return sendMessageSafe(conn, jid, { text, ...options }, { quoted });
}

// FUNGSI GET GROUP METADATA DENGAN PROTECTION
async function getGroupMetadataSafe(conn, chatId) {
    try {
        if (conn.chats?.[chatId]?.metadata) {
            return conn.chats[chatId].metadata;
        }
        
        await rateProtector.waitIfNeeded(chatId, 'metadata');
        const metadata = await conn.groupMetadata(chatId).catch(() => ({}));
        
        if (!conn.chats) conn.chats = {};
        if (!conn.chats[chatId]) conn.chats[chatId] = {};
        conn.chats[chatId].metadata = metadata;
        
        return metadata;
    } catch (error) {
        if (error.message?.includes('rate-overlimit') || error.message?.includes('429') || error.data === 429) {
            rateProtector.markAsRateLimited(chatId, 'metadata');
        }
        return {};
    }
}

export async function handler(chatUpdate) {
    if (!chatUpdate) return;

    this.pushMessage?.(chatUpdate.messages).catch(console.error);
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;

    dailyLimitReset();

    try {
        m = (await smsg(this, m)) || m;
        if (m.sender.endsWith("@broadcast")) return;
        if (m?.msg?.contextInfo?.mentionedJid?.length) {
            if (!this.storeMentions) this.storeMentions = {};
            const jidMentions = [...new Set(m.msg.contextInfo.mentionedJid.map(jid => this.getLid?.(jid) || jid))];
            this.storeMentions[m.id] = jidMentions;
        }
        if (m.isBaileys) return;

        const decodedOwnLid = await Promise.all(global.owner.map(o => this.getLidPN?.(`${o.replace(/[^0-9]/g, "")}@s.whatsapp.net`) || `${o.replace(/[^0-9]/g, "")}@s.whatsapp.net`));
        const isOwner = decodedOwnLid.includes(m.sender) || m.fromMe;
        
        if (global.opts["self"] && !isOwner) return;

        const botJid = getBotJid(this);

        try {
            if (global.db.data == null) await global.loadDatabase();

            // USER DATABASE - SISTEM LIMIT SAMA SEPERTI KODE PERTAMA
            let user = global.db.data.users[m.sender];
            if (typeof user !== "object") global.db.data.users[m.sender] = {};
            if (user) {
                if (!("name" in user)) user.name = m.name;
                if (!isNumber(user.age)) user.age = -1;
                if (!isNumber(user.level)) user.level = 0;
                if (!isNumber(user.exp)) user.exp = 0;
                
                const isPremiumActive = user.premium && user.premiumTime > Date.now();
                if (!isNumber(user.limit)) {
                    user.limit = isPremiumActive ? Infinity : 10;
                } else if (isPremiumActive && user.limit !== Infinity) {
                    user.limit = Infinity;
                } else if (!isPremiumActive && (user.limit === Infinity || user.limit === -1)) {
                    user.limit = 10;
                }
                
                if (!("afk" in user)) user.afk = false;
                if (!("afkReason" in user)) user.afkReason = "";
                if (!("register" in user)) user.register = false;
                if (!("premium" in user)) user.premium = false;
                if (!("banned" in user)) user.banned = false;
                if (!isNumber(user.afkTime)) user.afkTime = -1;
                if (!isNumber(user.regTime)) user.regTime = -1;
                if (!isNumber(user.premiumTime)) user.premiumTime = 0;
                if (!isNumber(user.premiumDate)) user.premiumDate = -1;
                if (!isNumber(user.bannedDate)) user.bannedDate = -1;
            } else {
                global.db.data.users[m.sender] = {
                    name: m.name || "User", age: -1, level: 0, exp: 0, 
                    limit: 10,
                    afk: false, afkReason: "", register: false, premium: false, banned: false,
                    afkTime: -1, regTime: -1, premiumTime: 0, premiumDate: -1, bannedDate: -1
                };
            }

            // GROUP DATABASE
            if (m.isGroup) {
                let chat = global.db.data.chats[m.chat];
                if (typeof chat !== "object") global.db.data.chats[m.chat] = {};
                if (chat) {
                    if (!("antispam" in chat)) chat.antispam = false;
                    if (!("antilink" in chat)) chat.antilink = false;
                    if (!("antivirtex" in chat)) chat.antivirtex = false;
                    if (!("mute" in chat)) chat.mute = false;
                    if (!("detect" in chat)) chat.detect = true;
                    if (!("sambutan" in chat)) chat.sambutan = true;
                    if (!("sewa" in chat)) chat.sewa = false;
                    if (!("sWelcome" in chat)) chat.sWelcome = "";
                    if (!("sBye" in chat)) chat.sBye = "";
                    if (!("sPromote" in chat)) chat.sPromote = "";
                    if (!("sDemote" in chat)) chat.sDemote = "";
                    if (!isNumber(chat.sewaDate)) chat.sewaDate = -1;
                } else {
                    global.db.data.chats[m.chat] = {
                        antispam: false, antilink: false, antivirtex: false, mute: false,
                        detect: true, sambutan: true, sewa: false,
                        sWelcome: "", sBye: "", sPromote: "", sDemote: "", sewaDate: -1
                    };
                }
            }

            // BOT SETTINGS
            let setting = global.db.data.settings[botJid];
            if (typeof setting !== "object") global.db.data.settings[botJid] = {};
            if (setting) {
                if (!("chatMode" in setting)) setting.chatMode = "";
                if (!("antispam" in setting)) setting.antispam = true;
                if (!("autoread" in setting)) setting.autoread = false;
                if (!("autobackup" in setting)) setting.autobackup = true;
                if (!isNumber(setting.backupDate)) setting.backupDate = -1;
            } else {
                global.db.data.settings[botJid] = {
                    chatMode: "", antispam: true, autoread: false, autobackup: true, backupDate: -1
                };
            }
        } catch (error) {
            console.log('[DB ERROR]', error);
        }

        if (typeof m.text !== "string") m.text = "";

        const isROwner = decodedOwnLid.includes(m.sender) || (botJid && m.sender === botJid);
        let usedPrefix;

        let groupMetadata = {};
        if (m.isGroup) {
            try {
                groupMetadata = await getGroupMetadataSafe(this, m.chat);
            } catch (e) {
                groupMetadata = {};
            }
        }

        const participants = m.isGroup ? groupMetadata.participants || [] : [];
        const user = m.isGroup ? participants.find(u => u.id === m.sender) : {};
        const bot = m.isGroup ? participants.find(u => u.id === botJid) : {};
        const isRAdmin = user?.admin === "superadmin" || false;
        const isAdmin = isRAdmin || user?.admin === "admin" || false;
        const isBotAdmin = bot?.admin || false;

        const isRegister = global.db.data?.users[m.sender]?.register === true;
        const isPremium = global.db.data?.users[m.sender]?.premium === true && global.db.data.users[m.sender]?.premiumTime > Date.now();
        const isBannned = global.db.data?.users[m.sender]?.banned === true;
        const isMuted = m.isGroup && global.db.data?.chats[m.chat]?.mute === true;
        const isSewa = m.isGroup && global.db.data?.chats[m.chat]?.sewa === true;
        const chatMode = global.db.data?.settings[botJid]?.chatMode;

        if ((chatMode === "pconly" || global.opts["pconly"]) && !isPremium && !isOwner && m.isGroup) return;
        if ((chatMode === "gconly" || global.opts["gconly"]) && !isPremium && !isOwner && !m.isGroup) return;
        if ((chatMode === "sewaonly" || global.opts["sewaonly"]) && !isPremium && !isOwner && !isSewa && m.isGroup) return;

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins");
        for (let name in global.plugins) {
            let plugin = global.plugins[name];
            if (!plugin || plugin?.disable) continue;

            const __filename = path.join(___dirname, name);
            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
            let _prefix = plugin.customPrefix ? plugin.customPrefix : global.prefix;
            let match = (
                _prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]]
                : Array.isArray(_prefix) ? _prefix.map(p => {
                    let re = p instanceof RegExp ? p : new RegExp(str2Regex(p));
                    return [re.exec(m.text), re];
                })
                : typeof _prefix === "string" ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
                : [[[], new RegExp()]]
            ).find(p => p[1]);

            if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, m, { match, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPremium, isBannned, isMuted, isRegister, isSewa, chatUpdate, __dirname, __filename })) continue;
            }
            if (typeof plugin !== "function") continue;

            if ((usedPrefix = (match[0] || "")[0])) {
                let noPrefix = m.text.replace(usedPrefix, "");
                let [command, ...args] = noPrefix.trim().split(` `).filter(v => v);
                args = args || [];
                let _args = noPrefix.trim().split(` `).slice(1);
                let text = _args.join(` `);
                command = (command || "").toLowerCase();
                let isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                               Array.isArray(plugin.command) ? plugin.command.some(cmd => (cmd instanceof RegExp ? cmd.test(command) : cmd === command)) :
                               typeof plugin.command === "string" ? plugin.command === command : false;

                if (!isAccept) continue;
                m.plugin = name;

                if (isMuted && !isROwner && !isAdmin) return;
                if (isBannned && !isROwner && !isOwner) return;

                if (plugin.rowner && !isROwner) { global.dFail("rowner", m, this); continue; }
                if (plugin.owner && !isOwner) { global.dFail("owner", m, this); continue; }
                if (plugin.premium && !isPremium) { global.dFail("premium", m, this); continue; }
                if (plugin.group && !m.isGroup) { global.dFail("group", m, this); continue; }
                if (plugin.botAdmin && !isBotAdmin) { global.dFail("botAdmin", m, this); continue; }
                if (plugin.admin && !isAdmin) { global.dFail("admin", m, this); continue; }
                if (plugin.private && m.isGroup) { global.dFail("private", m, this); continue; }
                if (plugin.register && !isRegister) { global.dFail("unreg", m, this); continue; }
                if (plugin.restrict) { global.dFail("restrict", m, this); continue; }

                m.isCommand = true;

                // SISTEM LIMIT - SAMA SEPERTI KODE PERTAMA (DENGAN PESAN)
                let limitUsed = false;
                let limitCost = 0;
                let isPremiumActive = isPremium;

                if (plugin.limit) {
                    limitCost = typeof plugin.limit === "number" ? plugin.limit : 1;
                    const user = global.db.data.users[m.sender];

                    if (!isPremiumActive) {
                        if (user.limit < limitCost) {
                            // PESAN LIMIT HABIS - MENGGUNAKAN FUNGSI SAFE
                            await replySafe(this, m.chat, 
`> *[ Warning ]* Limit kamu habis bro, tunggu reset limit ya
Sisa limit: ${user.limit}
*Reset otomatis tiap jam 00:00 WIB*`, m);
                            continue;
                        }
                        limitUsed = true;
                    } else {
                        limitUsed = false;
                    }
                }

                let extra = { 
                    match, 
                    conn: this, 
                    usedPrefix, 
                    noPrefix, 
                    _args, 
                    args, 
                    command, 
                    text, 
                    participants, 
                    groupMetadata, 
                    user, 
                    bot, 
                    isROwner, 
                    isOwner, 
                    isRAdmin, 
                    isAdmin, 
                    isBotAdmin, 
                    isPremium, 
                    isBannned, 
                    isMuted, 
                    isRegister, 
                    isSewa, 
                    chatUpdate, 
                    __dirname, 
                    __filename,
                    sendMessageSafe,
                    replySafe
                };

                try {
                    await rateProtector.delay(500);
                    await plugin.call(this, m, extra);
                } catch (e) {
                    console.log('[PLUGIN ERROR]', e);
                    const text = format(e);
                    if (e.name && decodedOwnLid[0]) {
                        let msg = `*『 ERROR MESSAGE 』*\n*PLUGIN:* ${m.plugin}\n*SENDER:* ${m.sender}\n*CHAT:* ${m.chat}\n*COMMAND:* ${usedPrefix + command}\n*ERROR:*\n${text}`;
                        await sendMessageSafe(this, decodedOwnLid[0], msg);
                    }
                } finally {
                    // KURANGI LIMIT DENGAN PESAN - SAMA SEPERTI KODE PERTAMA
                    if (plugin.limit && limitUsed && !isPremiumActive) {
                        global.db.data.users[m.sender].limit -= limitCost;
                        // KIRIM PESAN LIMIT BERKURANG - MENGGUNAKAN FUNGSI SAFE
                        await replySafe(this, m.chat, 
`ʟɪᴍɪᴛ ʙᴇʀᴋᴜʀᴀɴɢ -${limitCost} | sɪsᴀ: ${global.db.data.users[m.sender].limit} ʟɪᴍɪᴛ
ʜᴇᴍᴀʏ ʟɪᴍɪᴛ ʏᴀ ʙʀᴇ!`, m);
                    }

                    // NOTIFIKASI UNTUK PREMIUM USER - SAMA SEPERTI KODE PERTAMA
                    if (plugin.limit && isPremiumActive) {
                        await replySafe(this, m.chat, 
`> ᴜsᴇʀ ᴘʀᴇᴍɪᴜᴍ`, m);
                    }

                    if (typeof plugin.after === "function") {
                        try { await plugin.after.call(this, m, extra); }
                        catch (error) { console.log('[AFTER ERROR]', error); }
                    }
                }
                break;
            }
        }
    } catch (error) {
        console.log('[HANDLER ERROR]', error);
    } finally {
        try { await printMessages(m, this); } catch (e) { console.log('[PRINT ERROR]', e); }
    }
}

export async function participantsUpdate({ id, participants, action }) {
    try {
        if (this.isHandlerInit) return;
        let chat = global.db.data?.chats[id] || {};

        let message;
        switch (action) {
            case "add":
            case "remove":
                if (chat?.sambutan) {
                    await rateProtector.delay(2000);
                    
                    let groupMetadata = await getGroupMetadataSafe(this, id);
                    
                    const delayTime = participants.length > 5 ? 3000 : 1500;
                    
                    for (let user of participants) {
                        let lid = (user?.id || "").toString();
                        if (!lid || lid.endsWith("@g.us")) continue;
                        if (lid.endsWith("@s.whatsapp.net")) lid = await this.getLidPN?.(lid) || lid;

                        let pp;
                        try { 
                            pp = { url: await this.profilePictureUrl(lid, "image") }; 
                        } catch (e) { 
                            pp = { url: await this.profilePictureUrl(id, "image").catch(() => "") }; 
                        }

                        message = (action === "add"
                            ? (chat.sWelcome || this.sWelcome || "Selamat Datang @user")
                                  .replace("@subject", await this.getName(id))
                                  .replace("@desc", groupMetadata.desc ? String.fromCharCode(8206).repeat(4001) + groupMetadata.desc : "")
                            : chat.sBye || this.sBye || "Selamat Tinggal @user"
                        ).replace("@user", "@" + lid.split("@")[0]);

                        try {
                            await sendMessageSafe(this, id, { 
                                image: pp, 
                                caption: message, 
                                contextInfo: { mentionedJid: [lid] }
                            }, { quoted: null });
                            await rateProtector.delay(delayTime);
                        } catch (e) {
                            await sendMessageSafe(this, id, { 
                                text: message, 
                                contextInfo: { mentionedJid: [lid] }
                            }, { quoted: null });
                            await rateProtector.delay(delayTime);
                        }
                        
                        if (participants.length > 3) {
                            await rateProtector.delay(1000);
                        }
                    }
                }
                break;

            case "promote":
            case "demote":
                if (chat?.detect) {
                    for (let user of participants) {
                        let lid = (user?.id || "").toString();
                        if (!lid || lid.endsWith("@g.us")) continue;
                        if (lid.endsWith("@s.whatsapp.net")) lid = await this.getLidPN?.(lid) || lid;
                        
                        message = (action === "promote"
                            ? chat.sPromote || this.sPromote || "Selamat @user telah menjadi Admin"
                            : chat.sDemote || this.sDemote || "@user telah diberhentikan sebagai Admin"
                        ).replace("@user", "@" + lid.split("@")[0]);

                        await sendMessageSafe(this, id, { 
                            text: message, 
                            contextInfo: { mentionedJid: [lid] }
                        }, { quoted: null });
                        await rateProtector.delay(2000);
                    }
                }
                break;
        }
    } catch (e) {
        console.error('[PARTICIPANTS UPDATE ERROR]', e);
    }
}

export async function groupsUpdate(groupsUpdate) {
    try {
        if (!groupsUpdate) return;
        for (const groupUpdate of groupsUpdate) {
            const id = groupUpdate.id;
            if (!id) continue;
            
            await rateProtector.delay(1000);
            
            let text = "";
            const chat = global.db.data?.chats[id];
            if (!chat?.detect) continue;

            if (groupUpdate?.author) {
                let user = (groupUpdate?.author || "").toString();
                if (user?.endsWith("@s.whatsapp.net")) user = await this.getLidPN?.(user) || user;

                if (groupUpdate.desc && user) text = (chat?.sDesc || "*Deskripsi group diganti oleh* @user\n\n@desc").replace("@user", `@${user.split("@")[0]}`).replace("@desc", groupUpdate.desc);
                if (groupUpdate.subject && user) text = (chat?.sSubject || "*Judul group diganti oleh* @user\n\n@subject").replace("@user", `@${user.split("@")[0]}`).replace("@subject", groupUpdate.subject);
                if (groupUpdate.inviteCode && user) text = "*Link group diganti oleh* @user".replace("@user", `@${user.split("@")[0]}`);
                if (!text) continue;
                
                await sendMessageSafe(this, id, { text, mentions: [user] }, {});
                await rateProtector.delay(2000);
            }
            if (groupUpdate.icon) {
                await rateProtector.delay(1000);
                await replySafe(this, id, "*Ikon group telah diganti*");
            }
        }
    } catch (e) {
        console.error('[GROUPS UPDATE ERROR]', e);
    }
}

export async function catchDeleted(message) {
    try {
        if (!message) return;
    } catch (error) {
        console.error(error);
    }
}

global.dFail = (type, m, conn) => {
    let msg = {
        rowner: "*ᴅᴇᴠᴇʟᴏᴘᴇʀ ᴏɴʟʏ*", owner: "*ᴏᴡɴᴇʀ ᴏɴʟʏ*", premium: "*ᴘʀᴇᴍɪᴜᴍ ᴏɴʟʏ*",
        group: "*ɢʀᴏᴜᴘ ᴄʜᴀᴛ ᴏɴʟʏ*", private: "*ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ ᴏɴʟʏ*", admin: "*ᴀᴅᴍɪɴ ᴏɴʟʏ*",
        botAdmin: "*ʙᴏᴛ ᴀᴅᴍɪɴ ʀᴇǫᴜɪʀᴇᴅ*", sewa: "*ᴘᴀɪᴅ ɢʀᴏᴜᴘ ᴏɴʟʏ*", unreg: "*ʏᴏᴜ ᴀʀᴇ ɴᴏᴛ ʀᴇɢɪsᴛᴇʀᴇᴅ*",
        restrict: "*ʀᴇsᴛʀɪᴄᴛᴇᴅ ᴄᴏᴍᴍᴀɴᴅ*", disable: "*ᴅɪsᴀʙʟᴇ ᴄᴏᴍᴍᴀɴᴅ*"
    }[type];
    if (msg) return conn.reply(m.chat, msg, m);
};

let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
    unwatchFile(file);
    console.log(`${chalk.white.bold(" [ HOOKREST SYSTEM ]")} ${chalk.green.bold(`FILE DIUPDATE "handler.js"`)}`);
    import(`${file}?update=${Date.now()}`).catch(console.error);
});

export default handler;