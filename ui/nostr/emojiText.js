export function createEmojiImages(text, tags) {

    // Build emoji map from this text
    let hasEmojis = false;
    let emojiMap = {}
    for (let tag of tags) {
        if (tag.length < 3) continue;
        if (tag[0] != 'emoji') continue;
        emojiMap[tag[1]] = tag[2];
        hasEmojis = true;
    }

    // Quick exit
    if (!hasEmojis) return text;

    // Regular expression to match emoji shortcode
    const emojiRegex = /(\:[A-Za-z0-9 ]*\:)/gi;

    // Run through doing replacements
    return text.replace(emojiRegex, (match) => {
        let emojicode = match.substr(1, match.length - 2);
        if (emojiMap.hasOwnProperty(emojicode)) {
            return " " + emojiMap[emojicode] + " ";
        } else {
            return match;
        }
    });
}

export function addMissingEmojiTags(tags, v) {
    let customEmojiTags = sessionStorage.getItem('customEmojiTags');
    if (customEmojiTags) {
        customEmojiTags = JSON.parse(customEmojiTags);
        const reEmojis = /(\:[A-Za-z0-9 ]*\:)/gi;
        let emojis = undefined;
        emojis = v.match(reEmojis);
        if (emojis) {
            for (let emoji of emojis) {
                let emojicode = emoji.substr(1, emoji.length - 2);
                let f = false;
                for(let t of tags) {
                    if (t.length < 3) continue;
                    if (t[0] != 'emoji') continue;
                    if (t[1] == emojicode) {
                        f = true;
                        break;
                    }
                }
                if (!f) {
                    for(let cet of customEmojiTags) {
                        if (cet[1] == emojicode) {
                            tags.push(cet);
                            break;
                        }
                    }
                }
            }
        }
    }
    return tags;       
}

export function buildCustomEmojiTags() {
    let customEmojiTags = sessionStorage.getItem('customEmojiTags');
    let customEmojiTagsTime = sessionStorage.getItem('customEmojiTags.buildTime');
    if (!customEmojiTags || !customEmojiTagsTime || ((customEmojiTagsTime + 60000) < Date.now())) {
        let customEmojiTags = []
        // my custom emojis
        let customEmojis = sessionStorage.getItem('customEmojis');
        if (customEmojis) {
            customEmojis = JSON.parse(customEmojis);
            for (let ce of customEmojis) {
                if (!ce.hasOwnProperty('names')) continue;
                if (!ce.hasOwnProperty('imgUrl')) continue;
                let cev = ce.imgUrl;
                if (cev.startsWith("/")) cev = `${jamConfig.urls.jam}${cev}`;
                let cek = ce.names[0];
                customEmojiTags.push(['emoji',cek,cev]);
            }
        }
        // add any seen in user profiles
        let suffix = 'kind0tags';
        for (let ssk of Object.keys(sessionStorage)) {
            if (ssk.endsWith(suffix)) {
                let ssv = sessionStorage.getItem(ssk);
                try {
                    ssv = JSON.parse(ssv);
                    for (let t of ssv) {
                        if (t.length < 3) continue;
                        if (t[0] == 'emoji') customEmojiTags.push(t);
                    }
                } finally {}
            }
        }
        sessionStorage.setItem('customEmojiTags', JSON.stringify(customEmojiTags));
        sessionStorage.setItem('customEmojiTags.buildTime', Date.now());
    }
}