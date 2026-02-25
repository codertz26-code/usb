const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

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

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402325089913@newsletter',
            newsletterName: '© 𝐒𝐈𝐋𝐀 𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

// ============================================
// SONG2 COMMAND - IMPROVED VERSION
// ============================================
cmd({
    pattern: "song",
    alias: ["mp3", "play"],
    react: "🎵",
    desc: "Download song with cover art",
    category: "download",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!q) return await conn.sendMessage(from, {
        text: `┏━❑ 𝐇𝐎𝐖 𝐓𝐎 𝐔𝐒𝐄 ━━━━━━━━━
┃ ✦ song shape of you
┃ ✦ song https://youtube.com/...
┗━━━━━━━━━━━━━━━━━━━━
> © Powered by Sila Tech`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    
    // First, search for the song
    let videoData = null;
    let isDirectUrl = false;
    
    if (q.includes('youtube.com') || q.includes('youtu.be')) {
        // It's a direct URL
        isDirectUrl = true;
        const videoId = q.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
        
        if (!videoId) {
            return await conn.sendMessage(from, {
                text: `❌ 𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚈𝚘𝚞𝚃𝚞𝚋𝚎 𝚕𝚒𝚗𝚔\n\n> © Powered by Sila Tech`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }
        
        // Search to get video info
        const search = await yts({ videoId: videoId });
        if (search) videoData = search;
    } else {
        // It's a search query
        await conn.sendMessage(from, {
            text: `🔍 𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚈𝚘𝚞𝚃𝚞𝚋𝚎 𝚏𝚘𝚛 "${q}"...\n\n> © Powered by Sila Tech`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        
        const search = await yts(q);
        if (!search || !search.all || search.all.length === 0) {
            return await conn.sendMessage(from, {
                text: `❌ 𝙽𝚘 𝚛𝚎𝚜𝚞𝚕𝚝𝚜 𝚏𝚘𝚞𝚗𝚍 𝚏𝚘𝚛 "${q}"\n\n> © Powered by Sila Tech`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }
        
        videoData = search.all[0];
    }
    
    if (!videoData) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙲𝚘𝚞𝚕𝚍 𝚗𝚘𝚝 𝚐𝚎𝚝 𝚟𝚒𝚍𝚎𝚘 𝚒𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗\n\n> © Powered by Sila Tech`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    const videoUrl = videoData.url;
    const title = videoData.title || 'Unknown Title';
    const thumbnail = videoData.thumbnail || videoData.image;
    const duration = videoData.timestamp || videoData.duration || 'N/A';
    const views = videoData.views ? videoData.views.toLocaleString() : 'N/A';
    
    // Send the cover art/thumbnail with song info
    await conn.sendMessage(from, {
        image: { url: thumbnail },
        caption: `┏━❑ 𝐒𝐎𝐍𝐆 𝐈𝐍𝐅𝐎 ━━━━━━━━━
┃ 🎵 *𝚃𝚒𝚝𝚕𝚎:* ${title}
┃ ⏱️ *𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗:* ${duration}
┃ 👁️ *𝚅𝚒𝚎𝚠𝚜:* ${views}
┃ 🔗 *𝚄𝚁𝙻:* ${videoUrl}
┗━━━━━━━━━━━━━━━━━━━━
⏳ 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝙼𝙿𝟹...\n\n> © Powered by Sila Tech`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    
    try {
        // Try using the alternative API first (since it works)
        const fallbackApi = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
        
        const fallbackResponse = await axios.get(fallbackApi, { timeout: 30000 });
        const fallbackData = fallbackResponse.data;
        
        if (fallbackData?.status && fallbackData.audio) {
            // Send as audio file
            await conn.sendMessage(from, {
                audio: { url: fallbackData.audio },
                mimetype: "audio/mpeg",
                fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`
            }, { quoted: fakevCard });
            
            // Send as document file
            await conn.sendMessage(from, {
                document: { url: fallbackData.audio },
                mimetype: "audio/mpeg",
                fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`
            }, { quoted: fakevCard });
            
            // No additional "download complete" message sent
            
        } else {
            // Fallback to other method if needed
            const apiUrl = `https://meta-api.zone.id/downloader/youtube?url=${encodeURIComponent(videoUrl)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const data = response.data;
            
            let audioUrl = data?.result?.audio || data?.result?.url;
            
            if (audioUrl) {
                // Send as audio file
                await conn.sendMessage(from, {
                    audio: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`
                }, { quoted: fakevCard });
                
                // Send as document file
                await conn.sendMessage(from, {
                    document: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`
                }, { quoted: fakevCard });
                
                // No additional "download complete" message sent
            } else {
                throw new Error('No audio URL found');
            }
        }
        
    } catch (error) {
        console.error('Download error:', error.message);
        
        // Send error message
        await conn.sendMessage(from, {
            text: `❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚊𝚞𝚍𝚒𝚘\n\n𝚁𝚎𝚊𝚜𝚘𝚗: ${error.message}\n\n> © Powered by Sila Tech`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍: ${e.message}\n\n> © Powered by Sila Tech`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    l(e);
}
});

