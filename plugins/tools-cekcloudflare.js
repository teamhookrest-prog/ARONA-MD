import cloudscraper from "cloudscraper";

async function detectCloudflare(url) {
    try {
        const res = await cloudscraper({
            url,
            resolveWithFullResponse: true
        });

        const h = res.headers;

        const isCF =
            h["server"]?.includes("cloudflare") ||
            h["cf-ray"] ||
            h["cf-cache-status"] ||
            h["cf-chl-bypass"] ||
            h["cf-chl-bypass-resp"];

        let statusText = "🟢 Normal";

        if (res.statusCode === 403) statusText = "🟥 Forbidden (Possible CF Protect)";
        else if ((res.statusCode === 429 || res.statusCode === 503) && isCF) statusText = "🔴 Cloudflare Challenge";
        else if (isCF) statusText = "🟠 Cloudflare Active";

        return {
            url,
            status: res.statusCode,
            cloudflare: isCF,
            statusText,
            server: h["server"] || "Unknown",
            ray: h["cf-ray"] || "-"
        };

    } catch (e) {
        return {
            error: true,
            url,
            statusText: "❌ Request Failed",
            message: e.message
        };
    }
}


let handler = async (m, { args, usedPrefix, command }) => {
    const url = args[0];
    if (!url) return m.reply(`⚠ Masukkan URL!\nContoh:\n> ${usedPrefix + command} https://example.com`);

    const result = await detectCloudflare(url);

    if (result.error) return m.reply(`❌ Error: ${result.message}`);

    const reply = `
🌐 *CLOUD FLARE CHECK*
────────────────────
🔗 URL: ${result.url}
📶 Status: ${result.statusText} (${result.status})
🛡 Cloudflare: ${result.cloudflare ? "✔ YA" : "❌ TIDAK"}
🖥 Server: ${result.server}
⚡ CF-Ray: ${result.ray}
`.trim();

    return m.reply(reply);
};

handler.help = ["cf", "cloudflare"];
handler.tags = ["tools"];
handler.command = /^cf|cloudflare$/i;
handler.limit = true;

export default handler;