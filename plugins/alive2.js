const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const moment = require('moment-timezone');

// Define combined fakevCard 
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© 𝐒𝐈𝐋𝐀-𝐌𝐃",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝐒𝐈𝐋𝐀 𝐌𝐃 𝐁𝐎𝐓\nORG:𝐒𝐈𝐋𝐀-𝐌𝐃;\nTEL;type=CELL;type=VOICE;waid=255789661031:+255789661031\nEND:VCARD`
    }
  }
};

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

cmd({
    pattern: "alive",
    desc: "Check if bot is alive and active",
    category: "main",
    react: "💚",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, pushName }) => {
    try {
        const uptime = formatUptime(process.uptime());
        const timeZone = 'Africa/Dar_es_Salaam';
        const time = moment.tz(timeZone).format('hh:mm:ss A');
        const date = moment.tz(timeZone).format('DD/MM/YYYY');
        const mode = config.MODE === 'public' ? 'PUBLIC' : 'PRIVATE';
        const prefix = config.PREFIX || '.';
        
        const aliveMessage = 
`┏━❑ 𝐒𝐈𝐋𝐀-𝐌𝐃 𝐁𝐎𝐓 ━━━━━━━━━
┃ ✅ Status: ALIVE & ACTIVE
┃ 👤 User: ${pushName || sender.split('@')[0]}
┃ 🚀 Mode: ${mode}
┃ 🔧 Prefix: ${prefix}
┃ ⏱️ Uptime: ${uptime}
┃ 📅 Date: ${date}
┃ 🕐 Time: ${time}
┃ 💚 Bot Health: 100%
┗━━━━━━━━━━━━━━━━━━━━`;
        
        // Create buttons for the menu
        const buttons = [
            { 
                buttonId: `${prefix}menu`, 
                buttonText: { displayText: '📋 MENU' }, 
                type: 1 
            },
            { 
                buttonId: `${prefix}owner`, 
                buttonText: { displayText: '👑 OWNER' }, 
                type: 1 
            },
            { 
                buttonId: `${prefix}ping`, 
                buttonText: { displayText: '📊 PING' }, 
                type: 1 
            },
            { 
                buttonId: `${prefix}help`, 
                buttonText: { displayText: '❓ HELP' }, 
                type: 1 
            }
        ];
        
        const imageUrl = 'https://files.catbox.moe/36vahk.png';
        
        try {
            // Send image with buttons
            await conn.sendMessage(from, 
                { 
                    image: { url: imageUrl },
                    caption: aliveMessage,
                    footer: '⬇️ Choose an option below ⬇️',
                    buttons: buttons,
                    headerType: 4 // 4 = IMAGE
                },
                { quoted: fakevCard }
            );
        } catch (imageError) {
            console.log("Image with buttons error, trying text with buttons:", imageError);
            
            try {
                // Try sending text with buttons
                await conn.sendMessage(from, 
                    { 
                        text: aliveMessage,
                        footer: '⬇️ Choose an option below ⬇️',
                        buttons: buttons,
                        headerType: 1 // 1 = TEXT
                    },
                    { quoted: fakevCard }
                );
            } catch (buttonError) {
                console.log("Button error, sending text only:", buttonError);
                // Fallback to simple text
                await conn.sendMessage(from, 
                    { text: aliveMessage + '\n\nUse: .menu | .owner | .ping | .help' },
                    { quoted: fakevCard }
                );
            }
        }
        
    } catch (e) {
        reply("❌ Error: " + e.message);
    }
});
