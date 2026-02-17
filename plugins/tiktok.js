const { cmd } = require('../command');
const { ttdl } = require("ruhend-scraper");
const axios = require('axios');
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const fs = require('fs');

// Store processed message IDs and pending downloads
const processedMessages = new Set();
const pendingDownloads = new Map();

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

// Default image for slides (weka picha yako hapa)
const DEFAULT_IMAGE = './image.jpg'; // Badili na path ya picha yako

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl", "tiktokdl"],
    react: "🔄",
    desc: "Download TikTok videos with slide selection",
    category: "download",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    try {
        // Check if message has already been processed
        if (processedMessages.has(m.key.id)) {
            return;
        }
        
        processedMessages.add(m.key.id);
        setTimeout(() => processedMessages.delete(m.key.id), 5 * 60 * 1000);

        // Get URL from arguments
        const url = q || args[0];
        
        if (!url) {
            return await conn.sendMessage(from, {
                text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Please provide a TikTok link\n┗━━━━━━━━━━━━━━━━━━━━\n\n*Example:* ${prefix}tiktok https://vm.tiktok.com/...\n\n> © Powered by Sila Tech`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }

        // Validate TikTok URL
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return await conn.sendMessage(from, {
                text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Invalid TikTok link\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }

        // Notify user that we're fetching
        await conn.sendMessage(from, {
            text: `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 ━━━━━━━━━━━━━\n┃ 🔄 Fetching video info...\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });

        // Fetch video data from multiple sources
        let videoData = {
            hd: null,
            sd: null,
            wm: null,
            audio: null,
            cover: null,
            title: "TikTok Video",
            author: "Unknown"
        };

        // Try APIs
        const apis = [
            `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`,
            `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`
        ];

        for (const apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 15000 });
                
                if (response.data) {
                    // PrinceTech API
                    if (response.data.result) {
                        videoData.hd = response.data.result.videoUrl;
                        videoData.audio = response.data.result.audioUrl;
                        videoData.title = response.data.result.title || videoData.title;
                        videoData.cover = response.data.result.cover;
                        break;
                    }
                    // Dreaded API
                    else if (response.data.tiktok) {
                        videoData.hd = response.data.tiktok.video;
                        videoData.audio = response.data.tiktok.audio;
                        videoData.cover = response.data.tiktok.thumbnail;
                        break;
                    }
                }
            } catch (e) {
                l(`API failed: ${e.message}`);
                continue;
            }
        }

        // Try ttdl as fallback
        if (!videoData.hd) {
            try {
                const ttdlData = await ttdl(url);
                if (ttdlData?.data?.length > 0) {
                    const media = ttdlData.data[0];
                    videoData.hd = media.url;
                    videoData.title = "TikTok Video";
                }
            } catch (e) {
                l(`ttdl failed: ${e.message}`);
            }
        }

        if (!videoData.hd && !videoData.audio) {
            return await conn.sendMessage(from, {
                text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Failed to fetch video\n┃ Try again later\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }

        // Prepare slides/cards for carousel
        const cards = [];
        const downloadOptions = [];

        // Option 1: Video HD (No Watermark)
        if (videoData.hd) {
            downloadOptions.push({ type: 'hd', url: videoData.hd, label: 'Video HD' });
            try {
                const media = await prepareWAMessageMedia(
                    { image: { url: videoData.cover || DEFAULT_IMAGE } },
                    { upload: conn.waUploadToServer }
                );
                
                cards.push({
                    header: proto.Message.InteractiveMessage.Header.create({
                        ...(media || {}),
                        title: "🎬 Video HD",
                        subtitle: "No Watermark • High Quality",
                        hasMediaAttachment: !!media,
                    }),
                    body: { 
                        text: `Title: ${videoData.title}\nQuality: HD (No WM)\n\nClick button below to download` 
                    },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "📥 Download HD",
                                id: `tt_hd_${m.key.id}`
                            })
                        }]
                    }
                });
            } catch (e) {
                l(`Media prep error: ${e.message}`);
            }
        }

        // Option 2: Audio Only
        if (videoData.audio) {
            downloadOptions.push({ type: 'audio', url: videoData.audio, label: 'Audio MP3' });
            try {
                const media = await prepareWAMessageMedia(
                    { image: { url: DEFAULT_IMAGE } },
                    { upload: conn.waUploadToServer }
                );
                
                cards.push({
                    header: proto.Message.InteractiveMessage.Header.create({
                        ...(media || {}),
                        title: "🎵 Audio Only",
                        subtitle: "MP3 Format • Music",
                        hasMediaAttachment: !!media,
                    }),
                    body: { 
                        text: `Title: ${videoData.title}\nFormat: MP3\n\nClick button below to download audio` 
                    },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🎧 Download Audio",
                                id: `tt_audio_${m.key.id}`
                            })
                        }]
                    }
                });
            } catch (e) {
                l(`Media prep error: ${e.message}`);
            }
        }

        // Option 3: Cover Image
        if (videoData.cover) {
            downloadOptions.push({ type: 'cover', url: videoData.cover, label: 'Cover Image' });
            try {
                const media = await prepareWAMessageMedia(
                    { image: { url: videoData.cover } },
                    { upload: conn.waUploadToServer }
                );
                
                cards.push({
                    header: proto.Message.InteractiveMessage.Header.create({
                        ...(media || {}),
                        title: "🖼️ Cover Image",
                        subtitle: "Thumbnail",
                        hasMediaAttachment: !!media,
                    }),
                    body: { 
                        text: `Video thumbnail/cover image\n\nClick button below to download` 
                    },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🖼️ Download Cover",
                                id: `tt_cover_${m.key.id}`
                            })
                        }]
                    }
                });
            } catch (e) {
                l(`Media prep error: ${e.message}`);
            }
        }

        if (cards.length === 0) {
            return await conn.sendMessage(from, {
                text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Could not prepare slides\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }

        // Store download info for listener
        pendingDownloads.set(m.key.id, {
            options: downloadOptions,
            title: videoData.title,
            timestamp: Date.now()
        });

        // Send Carousel Message
        const carouselMessage = generateWAMessageFromContent(
            from,
            {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { 
                                text: `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ━━━\n┃ 📱 Select quality below\n┃ 💡 Slide to see options\n┗━━━━━━━━━━━━━━━━━━━━` 
                            },
                            footer: { text: "© Powered by Sila Tech" },
                            carouselMessage: { cards, messageVersion: 1 },
                            contextInfo: getContextInfo({ sender: sender })
                        }
                    }
                }
            },
            { quoted: fakevCard }
        );

        const sent = await conn.relayMessage(from, carouselMessage.message, {
            messageId: carouselMessage.key.id
        });

        // React success
        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });

        // Setup listener for button clicks (valid for 5 minutes)
        const listener = async (msg) => {
            try {
                const upsert = msg.messages[0];
                if (!upsert?.message) return;

                // Check if it's a response to our carousel
                const messageText = upsert.message?.conversation || 
                                   upsert.message?.extendedTextMessage?.text || '';
                
                // Check for button response
                const buttonId = upsert.message?.buttonsResponseMessage?.selectedButtonId ||
                                upsert.message?.templateButtonReplyMessage?.selectedId ||
                                messageText;

                if (!buttonId || !buttonId.includes(m.key.id)) return;

                const fromJid = upsert.key.remoteJid;
                if (fromJid !== from) return;

                // Parse button ID
                const match = buttonId.match(/tt_(hd|audio|cover)_/);
                if (!match) return;

                const type = match[1];
                const downloadInfo = pendingDownloads.get(m.key.id);
                
                if (!downloadInfo) {
                    await conn.sendMessage(fromJid, {
                        text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Download expired\n┃ Use command again\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
                        contextInfo: getContextInfo({ sender: sender })
                    }, { quoted: fakevCard });
                    return;
                }

                const option = downloadInfo.options.find(opt => opt.type === type);
                if (!option) return;

                // React to selection
                await conn.sendMessage(fromJid, {
                    react: { text: '⬇️', key: upsert.key }
                });

                // Send downloading message
                await conn.sendMessage(fromJid, {
                    text: `┏━❑ 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐈𝐍𝐆 ━━━━━━━━━\n┃ ⬇️ Fetching ${option.label}...\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fakevCard });

                // Download file
                const response = await axios.get(option.url, {
                    responseType: 'arraybuffer',
                    timeout: 60000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const buffer = Buffer.from(response.data);

                // Send based on type
                if (type === 'audio') {
                    await conn.sendMessage(fromJid, {
                        audio: buffer,
                        mimetype: "audio/mp4",
                        ptt: false,
                        contextInfo: getContextInfo({ sender: sender })
                    }, { quoted: fakevCard });
                } else if (type === 'cover') {
                    await conn.sendMessage(fromJid, {
                        image: buffer,
                        caption: `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐂𝐎𝐕𝐄𝐑 ━━━━━━━\n┃ ✅ Downloaded successfully\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
                        contextInfo: getContextInfo({ sender: sender })
                    }, { quoted: fakevCard });
                } else {
                    // Video
                    await conn.sendMessage(fromJid, {
                        video: buffer,
                        mimetype: "video/mp4",
                        caption: `┏━❑ 𝐓𝐈𝐊𝐓𝐎𝐊 𝐕𝐈𝐃𝐄𝐎 ━━━━━━━━━\n┃ ✅ ${option.label} Downloaded\n┃ 📝 ${downloadInfo.title}\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
                        contextInfo: getContextInfo({ sender: sender })
                    }, { quoted: fakevCard });
                }

                // Success react
                await conn.sendMessage(fromJid, {
                    react: { text: '✅', key: upsert.key }
                });

                // Cleanup
                pendingDownloads.delete(m.key.id);
                conn.ev.off('messages.upsert', listener);

            } catch (error) {
                l(`Slide listener error: ${error.message}`);
                await conn.sendMessage(from, {
                    text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ Download failed\n┃ ${error.message}\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fakevCard });
            }
        };

        // Add listener
        conn.ev.on('messages.upsert', listener);

        // Auto cleanup after 5 minutes
        setTimeout(() => {
            pendingDownloads.delete(m.key.id);
            try {
                conn.ev.off('messages.upsert', listener);
            } catch(e) {}
        }, 5 * 60 * 1000);

    } catch (e) {
        l(e);
        await conn.sendMessage(from, {
            text: `┏━❑ 𝐄𝐑𝐑𝐎𝐑 ━━━━━━━━━━━━━\n┃ ❌ ${e.message}\n┗━━━━━━━━━━━━━━━━━━━━\n\n> © Powered by Sila Tech`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
    }
});