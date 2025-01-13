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

    // Regular expression to match emoji shortcode
    const emojiRegex = /(\:[A-Za-z0-9 ]*\:)/gi;

    // Run through doing replacements
    return text.replace(emojiRegex, (match) => {
        let emojicode = match.substr(1, match.length - 2);
        if (emojiMap.hasOwnProperty(emojicode)) {
            return " " + emojiMap[emojicode] + " ";
        } else {
            return ' ◌ ';
        }
    });
}

export function addMissingEmojiTags(tags, v) {
    let knownEmojiTags = sessionStorage.getItem('knownEmojiTags');
    if (knownEmojiTags) {
        knownEmojiTags = JSON.parse(knownEmojiTags);
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
                    for(let cet of knownEmojiTags) {
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

export function buildKnownEmojiTags() {
    let keyMain = 'knownEmojiTags';
    let keyTime = `${keyMain}.buildTime`;
    let knownEmojiTags = sessionStorage.getItem(keyMain);
    let knownEmojiTagsTime = sessionStorage.getItem(keyTime);
    if (knownEmojiTagsTime) knownEmojiTagsTime *= 1;
    let currentTime = Date.now();
    if (!knownEmojiTags || !knownEmojiTagsTime || ((knownEmojiTagsTime + 3000) < currentTime)) {
        let knownEmojiTags = []
        // my custom emojis
        let customEmojis = sessionStorage.getItem('customEmojis');
        if (customEmojis) {
            customEmojis = JSON.parse(customEmojis);
            for (let ce of customEmojis) {
                if (!ce.hasOwnProperty('names')) continue;
                if (!ce.hasOwnProperty('imgUrl')) continue;
                let cev = ce.imgUrl;
                if (cev.startsWith("/")) cev = `${jamConfig.urls.jam}${cev}`;
                for (let cek of ce.names) {
                    let kt = ['emoji',cek,cev];
                    knownEmojiTags.push(kt);
                }
            }
        }
        // add any seen in user profiles
        let suffix = '.kind0tags';
        Object.keys(sessionStorage).forEach(key => {
            if (key.endsWith(suffix)) {
                let ssv = sessionStorage.getItem(key);
                try {
                    ssv = JSON.parse(ssv);
                    for (let t of ssv) {
                        if (t.length < 3) continue;
                        if (t[0] == 'emoji') knownEmojiTags.push(t);
                    }
                } finally {}                   
            }
        });
        sessionStorage.setItem(keyMain, JSON.stringify(knownEmojiTags));
        sessionStorage.setItem(keyTime, currentTime);
    }
}