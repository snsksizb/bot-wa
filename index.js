// index.js
const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    makeInMemoryStore,
    jidNormalizedUser,
    PHONENUMBER_MCC,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const { Boom } = require("@hapi/boom")
const fs = require("fs")
const chalk = require("chalk")
const figlet = require("figlet")
const _ = require("lodash")
const PhoneNumber = require("awesome-phonenumber")

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) })

const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

function smsg(conn, m, store) {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = jidNormalizedUser(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = jidNormalizedUser(m.key.participant || '')
    }
    if (m.message) {
        m.mtype = getTypeMessage(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getTypeMessage(m.message[m.mtype].message)] : m.message[m.mtype])
        m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'templateButtonReplyMessage') && m.msg.selectedId || ""
        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
        if (m.quoted) {
            let type = getTypeMessage(quoted)
            m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
                type = getTypeMessage(m.quoted)
                m.quoted = m.quoted[type]
            }
            if (typeof m.quoted === 'string') m.quoted = {
                text: m.quoted
            }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
            m.quoted.sender = jidNormalizedUser(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === jidNormalizedUser(conn.user && conn.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false
                let q = await store.loadMessage(m.chat, m.quoted.id, conn)
                return exports.smsg(conn, q, store)
            }
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })
            m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key })
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options)
        }
    }
    m.name = !nullish(m.pushName) && m.pushName || conn.getName(m.sender)
    if (m.msg && m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg)
    m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || ''
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, 'file', '', m, { ...options }) : conn.sendText(chatId, text, m, { ...options })
    m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)))
    m.forward = (jid, forceForward = false) => conn.forwardMessage(jid, m, forceForward)
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => conn.copyNForward(jid, m, forceForward, options)

    return m
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    
    const conn = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !global.pairingCode,
        mobile: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterMap,
        defaultQueryTimeoutMs: 0,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    })
    
    store.bind(conn.ev)

    if (global.pairingCode && !conn.authState.creds.registered) {
        if (usePairingCode && !conn.authState.creds.registered) {
            const phoneNumber = global.phoneNumber
            if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
                console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example : +62xxx")))
                process.exit(0)
            }
            setTimeout(async () => {
                let code = await conn.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
            }, 3000)
        }
    }

    conn.ev.on("messages.upsert", async chatUpdate => {
        try {
            mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return
            if (!conn.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            m = smsg(conn, mek, store)
            require("./handler")(conn, m, chatUpdate, store)
        } catch (err) {
            console.log(err)
        }
    })

    conn.ev.on('group-participants.update', async (anu) => {
        console.log(anu)
        try {
            let metadata = await conn.groupMetadata(anu.id)
            let participants = anu.participants
            for (let num of participants) {
                try {
                    ppuser = await conn.profilePictureUrl(num, 'image')
                } catch {
                    ppuser = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
                }
                if (anu.action == 'add') {
                    conn.sendMessage(anu.id, { image: { url: ppuser }, mentions: [num], caption: `Welcome @${num.split("@")[0]} di group ${metadata.subject}` })
                } else if (anu.action == 'remove') {
                    conn.sendMessage(anu.id, { image: { url: ppuser }, mentions: [num], caption: `@${num.split("@")[0]} keluar dari group ${metadata.subject}` })
                }
            }
        } catch (err) {
            console.log(err)
        }
    })
    
    conn.ev.on('creds.update', saveCreds)
    
    return conn
}

startBot()
