const { cmd } = require('../command');
const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

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

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl", "tiktokdl"],
    react: "🔄",
    desc: "Download TikTok videos without watermark",
    category: "download",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    try {
        // Check if message has already been processed
        if (processedMessages.has(m.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(m.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(m.key.id);
        }, 5 * 60 * 1000);

        // Get URL from arguments
        const url = q || args[0];
        
        if (!url) {
            return await conn.sendMessage(from, {
                text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Please provide a TikTok link\n┗━━━━━━━━━━━━━━━━━━━━\n\n*Example:* ${prefix}tiktok https://vm.tiktok.com/...\n\n> © Powered by Sila Tech`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }

        // Check for various TikTok URL formats
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return await conn.sendMessage(from, {
                text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Invalid TikTok link\n┗━━━━━━━━━━━━━━━━━━━━\n\nPlease provide a valid TikTok video link.\n\n> © Powered by Sila Tech`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }

        // Try multiple APIs in sequence
        const apis = [
            `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`,
            `https://api.princetechn.com/api/download/tiktokdlv2?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
            `https://api.princetechn.com/api/download/tiktokdlv3?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
            `https://api.princetechn.com/api/download/tiktokdlv4?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
            `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`
        ];

        let videoUrl = null;
        let audioUrl = null;
        let title = null;

        // Try each API until one works
        for (const apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 10000 });
                
                if (response.data) {
                    // Handle different API response formats
                    if (response.data.result && response.data.result.videoUrl) {
                        // PrinceTech API format
                        videoUrl = response.data.result.videoUrl;
                        audioUrl = response.data.result.audioUrl;
                        title = response.data.result.title;
                        break;
                    } else if (response.data.tiktok && response.data.tiktok.video) {
                        // Dreaded API format
                        videoUrl = response.data.tiktok.video;
                        break;
                    } else if (response.data.video) {
                        // Alternative format
                        videoUrl = response.data.video;
                        break;
                    }
                }
            } catch (apiError) {
                l(`TikTok API failed: ${apiError.message}`);
                continue;
            }
        }

        // If no API worked, try the original ttdl method
        if (!videoUrl) {
            let downloadData = await ttdl(url);
            if (downloadData && downloadData.data && downloadData.data.length > 0) {
                const mediaData = downloadData.data;
                for (let i = 0; i < Math.min(20, mediaData.length); i++) {
                    const media = mediaData[i];
                    const mediaUrl = media.url;

                    // Check if URL ends with common video extensions
                    const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                                  media.type === 'video';

                    if (isVideo) {
                        await conn.sendMessage(from, {
                            video: { url: mediaUrl },
                            mimetype: "video/mp4",
                            caption: `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐕𝐈𝐃𝐄𝐎 ━━━━━━━━━\n┃ ✅ Downloaded successfully\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`
                        }, { quoted: fakevCard });
                    } else {
                        await conn.sendMessage(from, {
                            image: { url: mediaUrl },
                            caption: `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐈𝐌𝐀𝐆𝐄 ━━━━━━━━━\n┃ ✅ Downloaded successfully\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`
                        }, { quoted: fakevCard });
                    }
                }
                
                // Update react to success
                await conn.sendMessage(from, {
                    react: { text: '✅', key: m.key }
                });
                return;
            }
        }

        // Send the video if we got a URL from the APIs
        if (videoUrl) {
            try {
                // Download video as buffer for better reliability
                const videoResponse = await axios.get(videoUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                const videoBuffer = Buffer.from(videoResponse.data);
                
                const caption = title 
                    ? `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ━━━━━━━\n┃ 📝 Title: ${title}\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`
                    : `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ━━━━━━━\n┃ ✅ Video downloaded successfully\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`;
                
                await conn.sendMessage(from, {
                    video: videoBuffer,
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: fakevCard });

                // If we have audio URL, download and send it as well
                if (audioUrl) {
                    try {
                        const audioResponse = await axios.get(audioUrl, {
                            responseType: 'arraybuffer',
                            timeout: 30000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        });
                        
                        const audioBuffer = Buffer.from(audioResponse.data);
                        
                        await conn.sendMessage(from, {
                            audio: audioBuffer,
                            mimetype: "audio/mp4",
                            ptt: false
                        }, { quoted: fakevCard });
                    } catch (audioError) {
                        l(`Failed to download audio: ${audioError.message}`);
                    }
                }
                
                // Update react to success
                await conn.sendMessage(from, {
                    react: { text: '✅', key: m.key }
                });
                return;
                
            } catch (downloadError) {
                l(`Failed to download video: ${downloadError.message}`);
                // Fallback to URL method
                try {
                    const caption = title 
                        ? `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ━━━━━━━\n┃ 📝 Title: ${title}\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`
                        : `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ━━━━━━━\n┃ ✅ Video downloaded successfully\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`;
                    
                    await conn.sendMessage(from, {
                        video: { url: videoUrl },
                        mimetype: "video/mp4",
                        caption: caption
                    }, { quoted: fakevCard });
                    
                    await conn.sendMessage(from, {
                        react: { text: '✅', key: m.key }
                    });
                    return;
                } catch (urlError) {
                    l(`URL method also failed: ${urlError.message}`);
                }
            }
        }

        // If we reach here, no method worked
        await conn.sendMessage(from, {
            text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Failed to download\n┃ All download methods failed\n┗━━━━━━━━━━━━━━━━━━━━\n\nPlease try again with a different link.\n\n> © Powered by Sila Tech`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });

    } catch (e) {
        l(e);
        await conn.sendMessage(from, {
            text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Command failed\n┗━━━━━━━━━━━━━━━━━━━━\n\n${e.message}\n\n> © Powered by Sila Tech`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
    }
});