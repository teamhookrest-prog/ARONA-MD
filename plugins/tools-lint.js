import * as acorn from "acorn"
import { VM } from "vm2"

let handler = async (m, { text, quoted, command }) => {

    let code = text || quoted?.text || ""
    if (!code) return m.reply(`Usage:\n.${command} <code>\n\nExample:\n.${command} console.log("Hello")`)

    // Hapus prefix jika dikirim lewat eval (>)
    if (code.startsWith(`.${command}`)) code = code.replace(`.${command}`, '').trim()

    try {
        // Cek syntax
        acorn.parse(code, { ecmaVersion: 2024 })

        // Eksekusi code (sandbox aman)
        const vm = new VM({ timeout: 1500, sandbox: {} })

        let result
        try {
            result = vm.run(code)
        } catch (runtimeError) {
            return m.reply(
`⚠ Runtime Error
${runtimeError.message}`
            )
        }

        return m.reply(
result !== undefined 
? `✔ No syntax errors.\n\nOutput:\n${result}`
: `✔ No syntax errors.`
        )

    } catch (err) {

        let line = err.loc?.line || '?'
        let col = err.loc?.column || '?'

        let snippet = code.split("\n")[line - 1] || ""

        return m.reply(
`✖ Syntax Error

Line ${line}, Column ${col}
${err.message}

${line} | ${snippet}
${" ".repeat(col + 3)}^`
        )
    }
}

handler.help = ['lint']
handler.tags = ['tools']
handler.command = ['lint', 'ceksyntax', 'syntax']

export default handler