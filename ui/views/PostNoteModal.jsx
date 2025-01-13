import React, {useState} from 'react';
import {Modal} from './Modal';
import {isDark} from '../lib/theme';
import {useMqParser} from '../lib/tailwind-mqp';
import {useJam} from '../jam-core-react';
import {getPublicKey, signAndSendEvent} from '../nostr/nostr';
import { addMissingEmojiTags, buildKnownEmojiTags } from '../nostr/emojiText';

export const PostNoteModal = ({
    close,
    roomId,
    roomColor,
}) => {
    const [state] = useJam();    
    let mqp = useMqParser();
    const textColor = isDark(roomColor.buttons.primary) ? roomColor.text.light : roomColor.text.dark;
    let [postText, setPostText] = useState('');

    let submit = async e => {
        e.preventDefault();

        let myPubkey = await getPublicKey();
        let created_at = Math.floor(Date.now() / 1000);
        let tags = [];
        let content = postText;
        let kind = 1;

        let reHashes = /#\S*/g;
        let hashtags = postText.match(reHashes);
        if (hashtags) {
            for (let hashtag of hashtags) {
                let thehashtag = hashtag.replaceAll("#","");
                if (thehashtag.length > 0) {
                    tags.push(["t",thehashtag]);
                }
            }
        }

        let reNpubs = /npub1\S*/g;
        let npubs = postText.match(reNpubs);
        if (npubs) {
            for (let npub of npubs) {
                if (npub.length != 63) continue;
                try {
                    let targetPubkey = nip19.decode(npub).data;
                    tags.push(["p", targetPubkey]);
                } catch(e) {
                    // blackhole
                }
            }
        }

        let reNevents = /nevent1\S*/g;
        let nevents = postText.match(reNevents);
        if (nevents) {
            for (let nevent of nevents) {
                try {
                    let targetEventId = nip19.decode(nevent).data.id;
                    tags.push(["e",targetEventId]);
                } catch(e) {
                    // blackhole
                }
            }
        }
        let reNotes = /note1\S*/g;
        let notes = postText.match(reNotes);
        if (notes) {
            for (let note of notes) {
                try {
                    let targetEventId = nip19.decode(note).data;
                    tags.push(["e",targetEventId]);
                } catch(e) {
                    // blackhole
                }
            }
        }

        // Check if including a custom emoji reference
        buildKnownEmojiTags();
        tags = addMissingEmojiTags(tags, postText);

        let event = {
            created_at: created_at,
            content: content,
            kind: kind,
            pubkey: myPubkey,
            tags: tags,
        }

        console.log(JSON.stringify(event));
        await signAndSendEvent(event);

        close();
    };

    return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Post a Note</h2>
        <>
        <div className="flex justify-between">
        <textarea
            className={mqp(
                'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96 h-48'
            )}
            name="postContent"
            autoComplete="off"
            style={{
                fontSize: '15px',
            }}
            onBlur={async(e) => {
                setPostText(e.target.value);
            }}
        ></textarea>
        </div>

        <div className="h-12"></div>

        <div className="flex justify-between">
        <button
            onClick={submit}
            className="flex-grow h-12 px-4 text-md rounded-lg mr-2"
            style={{
                backgroundColor: roomColor.buttons.primary,
                color: textColor,
            }}
            >
                Publish to Nostr
        </button>
        </div>
        </>
      </div>  
    </Modal>
    );
};
