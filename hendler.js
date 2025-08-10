// handler.js
const { generateWAMessageFromContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getLastMessageInChat, makeWAMessage, proto } = require("@whiskeysockets/baileys")
const fs = require("fs")
const util = require("util")
const chalk = require("chalk")
const { Configuration, OpenAIApi } = require("openai")
const { Configuration, OpenAIApi } = require("openai")
const axios = require("axios")
const fetch = require("node-fetch")
const crypto = require("crypto")
const moment = require("moment-timezone")
const { exec, spawn, execSync } = require("child_process")

module.exports = async (conn, m, chatUpdate, store) => {
    try {
        var body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ''
        var budy = (typeof m.text == 'string' ? m.text : '')
        var prefix = prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : prefa ?? global.prefix
        const isCmd = body.startsWith(prefix)
        const command = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
        const args = body.trim().split(/ +/).slice(1)
        const pushname = m.pushName || "No Name"
        const botNumber = await conn.decodeJid(conn.user.id)
        const isCreator = [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const itsMe = m.sender == botNumber ? true : false
        const text = q = args.join(" ")
        const quoted = m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ''
        const qmsg = (quoted.msg || quoted)
        const isMedia = /image|video|sticker|audio/.test(mime)

        // Auto Reply System
        if (budy.toLowerCase() == 'p') {
            m.reply('Iya ada yang bisa saya bantu?')
        }
        if (budy.toLowerCase() == 'assalamualaikum') {
            m.reply('Waalaikumsalam warahmatullahi wabarakatuh')
        }
        if (budy.toLowerCase() == 'bot') {
            m.reply('Ada apa kak? Bot aktif 24 jam')
        }
        if (budy.toLowerCase() == 'menu') {
            let menu = `
┌──⭓ *MENU BOT*
│
├──⭓ *Info*
│   ├── .owner
│   ├── .ping
│   └── .runtime
│
├──⭓ *Downloader*
│   ├── .play [query]
│   ├── .tiktok [url]
│   ├── .ytmp4 [url]
│   └── .ytmp3 [url]
│
├──⭓ *Group*
│   ├── .kick @tag
│   ├── .add 628xxx
│   ├── .promote @tag
│   ├── .demote @tag
│   └── .tagall
│
├──⭓ *Fun*
│   ├── .sticker
│   ├── .toimg
│   ├── .tovideo
│   └── .ai [text]
│
└──⭓ *Owner*
    ├── .bc
    └── .join
    
Ketik .menu untuk melihat menu lengkap`
            m.reply(menu)
        }

        // Command System
        switch (command) {
            case 'ping': {
                m.reply(`Pong!\nSpeed: ${new Date() - m.messageTimestamp * 1000}ms`)
            }
            break
            
            case 'sticker': case 's': {
                if (!quoted) throw `Balas Video/Image dengan caption ${prefix + command}`
                if (/image/.test(mime)) {
                    let media = await conn.downloadAndSaveMediaMessage(quoted)
                    let encmedia = await conn.sendImageAsSticker(m.chat, media, m, { packname: global.packname, author: global.author })
                    await fs.unlinkSync(encmedia)
                } else if (/video/.test(mime)) {
                    if ((quoted.msg || quoted).seconds > 11) return m.reply('Maksimal 10 detik!')
                    let media = await conn.downloadAndSaveMediaMessage(quoted)
                    let encmedia = await conn.sendVideoAsSticker(m.chat, media, m, { packname: global.packname, author: global.author })
                    await fs.unlinkSync(encmedia)
                } else {
                    throw `Kirim Gambar/Video dengan caption ${prefix + command}\nDurasi Video 1-9 Detik`
                }
            }
            break
            
            case 'ai': {
                if (!text) throw `Contoh: ${prefix + command} siapa presiden indonesia`
                m.reply('Tunggu sebentar...')
                try {
                    let response = await fetch(`https://api.lolhuman.xyz/api/openai?apikey=YOUR_APIKEY&text=${text}`)
                    let data = await response.json()
                    m.reply(data.result)
                } catch (e) {
                    m.reply('Error saat memproses AI')
                }
            }
            break
            
            case 'play': {
                if (!text) throw `Contoh: ${prefix + command} lagu`
                m.reply('Searching...')
                try {
                    let response = await fetch(`https://api.lolhuman.xyz/api/ytplay?apikey=YOUR_APIKEY&query=${text}`)
                    let data = await response.json()
                    let { title, duration, thumbnail, download } = data.result
                    let caption = `
📌 Title: ${title}
⏱️ Duration: ${duration}
📥 Download: ${download.video}
                    `
                    conn.sendMessage(m.chat, { image: { url: thumbnail }, caption }, { quoted: m })
                } catch (e) {
                    m.reply('Error saat mencari lagu')
                }
            }
            break
            
            case 'kick': {
                if (!m.isGroup) throw mess.group
                if (!isBotAdmins) throw mess.botAdmin
                if (!isAdmins) throw mess.admin
                let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                await conn.groupParticipantsUpdate(m.chat, [users], 'remove').then((res) => m.reply(jsonformat(res))).catch((err) => m.reply(jsonformat(err)))
            }
            break
            
            case 'add': {
                if (!m.isGroup) throw mess.group
                if (!isBotAdmins) throw mess.botAdmin
                if (!isAdmins) throw mess.admin
                let users = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                await conn.groupParticipantsUpdate(m.chat, [users], 'add').then((res) => m.reply(jsonformat(res))).catch((err) => m.reply(jsonformat(err)))
            }
            break
            
            case 'bc': {
                if (!isCreator) throw mess.owner
                if (!text) throw `Text mana?\n\nExample: ${prefix + command} fatih-san`
                let getGroups = await conn.groupFetchAllParticipating()
                let groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
                let anu = groups.map(v => v.id)
                m.reply(`Mengirim Broadcast Ke ${anu.length} Group Chat, Waktu Selesai ${anu.length * 1.5} detik`)
                for (let i of anu) {
                    await sleep(1500)
                    await conn.sendText(i, `「 Broadcast Bot 」\n\n${text}`)
                }
                m.reply(`Sukses Mengirim Broadcast Ke ${anu.length} Group`)
            }
            break
            
            default:
                if (budy.startsWith('=>')) {
                    if (!isCreator) return
                    function Return(sul) {
                        sat = JSON.stringify(sul, null, 2)
                        bang = util.format(sat)
                        if (sat == undefined) {
                            bang = util.format(sul)
                        }
                        return m.reply(bang)
                    }
                    try {
                        m.reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
                    } catch (e) {
                        m.reply(String(e))
                    }
                }
        }

    } catch (err) {
        m.reply(util.format(err))
    }
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
