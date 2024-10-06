import React, {useState, useEffect} from 'react';
import {Modal} from '../Modal.jsx';
import {use} from 'use-minimal-state';
import {useJam} from '../../jam-core-react.js';
import {getUserMetadata, getNpubFromInfo, signAndSendEvent} from '../../nostr/nostr.js';
import {nip19} from 'nostr-tools';
import {isDark, colors} from '../../lib/theme.js';
import {useMqParser} from '../../lib/tailwind-mqp.js';
import {handleFileUpload} from '../../lib/fileupload.js';
import {LoadingIcon} from '../Svg.jsx';

export default function EditNostrProfile({close}) {
    let mqp = useMqParser();
    const [showErrorMsg, setErrorMsg] = useState(false);
    const [state, {updateInfo}] = useJam();
    const [id, myIdentity] = use(state, ['myId', 'myIdentity']);
    const info = myIdentity?.info;
    const colorTheme = state.room?.color ?? 'default';
    const roomColor = colors(colorTheme, state.room.customColor);
    const textColor = isDark(roomColor.avatarBg) ? roomColor.text.light : roomColor.text.dark;
    const npub = getNpubFromInfo(info);
    if (!npub) {
        close();
        return;
    }
    const pubkey = nip19.decode(npub).data;
    let metadata = {};
    const [extraMetadata, setExtraMetadata] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    // Fields to be supported from metadata
    const [about, setAbout] = useState(metadata?.about || '');
    const [banner, setBanner] = useState(metadata?.banner || '');
    const [display_name, setDisplay_Name] = useState(metadata?.display_name || '');
    const [lud16, setLud16] = useState(metadata?.lud16 || '');
    const [name, setName] = useState(metadata?.name || '');
    const [nip05, setNip05] = useState(metadata?.nip05 || '');
    const [picture, setPicture] = useState(metadata?.picture || '');
    const [website, setWebsite] = useState(metadata?.website || '');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!loaded) {
            const loadMetadata = async() => {
                // Look for existing metadata
                let metadataJSON = sessionStorage.getItem(`${npub}.kind0content`);
                if (!metadataJSON) {
                    const usermetadata = await getUserMetadata(pubkey, id);
                    metadataJSON = sessionStorage.getItem(`${npub}.kind0content`);
                }
                if (metadataJSON) {
                    try {
                        metadata = JSON.parse(metadataJSON);
                        setAbout(metadata?.about || '');
                        setBanner(metadata?.banner || '');
                        setDisplay_Name(metadata?.display_name || '');
                        setLud16(metadata?.lud16 || '');
                        setName(metadata?.name || '');
                        setNip05(metadata?.nip05 || '');
                        setPicture(metadata?.picture || '');
                        setWebsite(metadata?.website || '');
                        
                        let handledFields = ['about','banner','display_name','lud16','name','nip05','picture','website'];
                        let extrametadata = {}
                        Object.keys(metadata).forEach(key => {
                            if (!handledFields.includes(key)) extrametadata[key] = metadata[key];
                        });
                        setExtraMetadata(extrametadata);
                    } catch(ignore) { }
                }
            }
            loadMetadata();
            setLoaded(true);
        }
        // This function is called when component unmounts
        return () => {
        }
    }, []);

    let submit = async e => {
        e.preventDefault();

        setIsSaving(true);

        // Update nostr profile
        let metadata = {}
        let tags = []

        // NOTE: While we have existing session, we assume the user isn't editing
        // their profile in multiple different clients.  Once we load it locally
        // we update that and use for subsequent updates while session is active.
        // Look for existing metadata
        let metadataJSON = sessionStorage.getItem(`${npub}.kind0content`);
        if (!metadataJSON) {
            // Get latest from relays, so we can leave other fields intact
            const usermetadata = await getUserMetadata(pubkey, id);
            metadataJSON = sessionStorage.getItem(`${npub}.kind0content`);
        }
        let tagsJSON = sessionStorage.getItem(`${npub}.kind0tags`);
        if (metadataJSON) {
            try {
                metadata = JSON.parse(metadataJSON);
            } catch(ignore) {}
        }
        if (tagsJSON) {
            try {
                tags = JSON.parse(tagsJSON);
            } catch(ignore) {}
        }

        // Update fields that we support changes for
        metadata["about"] = about;
        metadata["banner"] = banner;
        metadata["display_name"] = display_name;
        metadata["lud16"] = lud16;
        metadata["name"] = name;
        metadata["nip05"] = nip05;
        metadata["picture"] = picture;
        metadata["website"] = website;

        // Save to session state
        sessionStorage.setItem(`${npub}.kind0content`, JSON.stringify(metadata));
        let m = JSON.parse(sessionStorage.getItem(npub));
        m["about"] = about;
        m["banner"] = banner;
        m["lightningAddress"] = lud16;
        m["nip05"] = {nipO5Address: nip05};
        sessionStorage.setItem(npub, JSON.stringify(m));

        // Create event
        const event = {
            id: null,
            pubkey: null,
            created_at: Math.floor(Date.now() / 1000),
            kind: 0,
            tags: tags,
            content: JSON.stringify(metadata),
            sig: null,
        };
        let r = await signAndSendEvent(event);

        // Update local identity, pushes to server and peers
        let ok = await updateInfo({name:name,avatar:picture});

        setIsSaving(false);

        // Close the dialog, or alert any error
        if (!r[0]) {
            setErrorMsg(r[1]);
        } else {
            close();
        }
    };

    let cancel = e => {
        e.preventDefault();
        close();
    };

    let uploadBannerFile = async e => {
        e.preventDefault();
        let buttonObject = document.getElementById('buttonUploadBanner');
        let fileObject = document.getElementById('fileUploadBanner');
        let textObject = document.getElementById('fileUploadingBanner');
        buttonObject.style.display = 'none';
        fileObject.style.display = 'none';
        textObject.style.display = 'inline';
        let urls = await handleFileUpload(fileUploadBanner);
        if (urls.length > 0) {
            setBanner(urls[0]);
        }
        textObject.style.display = 'none';
        fileObject.style.display = 'inline';
        buttonObject.style.display = 'inline';
    }
    let uploadPictureFile = async e => {
        e.preventDefault();
        let buttonObject = document.getElementById('buttonUploadPicture');
        let fileObject = document.getElementById('fileUploadPicture');
        let textObject = document.getElementById('fileUploadingPicture');
        buttonObject.style.display = 'none';
        fileObject.style.display = 'none';
        textObject.style.display = 'inline';
        let urls = await handleFileUpload(fileUploadPicture);
        if (urls.length > 0) {
            setPicture(urls[0]);
        }
        textObject.style.display = 'none';
        fileObject.style.display = 'inline';
        buttonObject.style.display = 'inline';
    }

    return (
    <Modal close={close}>
        <h1 className="text-gray-200">Edit Profile</h1>
        <form onSubmit={submit}>

        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
                Name (short name is required)
            </div>
            <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                type="text"
                placeholder=""
                value={name ?? ''}
                name="name"
                onChange={e => {
                    setName(e.target.value);
                }}
            />
        </div>

        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
                Display Name (alternative bigger name used by some clients)
            </div>
            <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                type="text"
                placeholder=""
                value={display_name ?? ''}
                name="display_name"
                onChange={e => {
                    setDisplay_Name(e.target.value);
                }}
            />
        </div>

        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
                Picture
            </div>
            <div className="flex justify-between">
                <img
                    className="w-full h-full"
                    src={picture}
                />
            </div>
            <div className="flex justify-between">
                <input
                    className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                    type="text"
                    placeholder=""
                    value={picture ?? ''}
                    name="picture"
                    onChange={e => {
                        setPicture(e.target.value);
                    }}
                />
            </div>
            <div className="flex justify-between">
                <input type="file" name="uploadPicture" id="fileUploadPicture" accept="image/*" 
                    className="w-full"
                    style={{
                        fontSize: '10pt',
                        margin: '0px',
                        marginLeft: '4px',
                        padding: '2px'
                    }} 
                />
            </div>
            <div>
                <button 
                    id="buttonUploadPicture"
                    className="px-5 text-md rounded-md" 
                    style={{
                        color: textColor,
                        backgroundColor: roomColor.buttons.primary,
                    }}
                    onClick={async(e) => {uploadPictureFile(e);}}
                >Upload</button>
            </div>
            <div id="fileUploadingPicture" style={{display: 'none', fontSize: '10pt', }}>...uploading file...</div>
        </div>

        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
                Banner
            </div>
            <div className="flex justify-between">
                <img
                    className="w-full h-full"
                    src={banner}
                />
            </div>
            <div className="flex justify-between">
                <input
                    className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                    type="text"
                    placeholder=""
                    value={banner ?? ''}
                    name="banner"
                    onChange={e => {
                        setBanner(e.target.value);
                    }}
                />                
            </div>
            <div className="flex justify-between">
                <input type="file" name="uploadBanner" id="fileUploadBanner" accept="image/*" 
                    className="w-full"
                    style={{
                        fontSize: '10pt',
                        margin: '0px',
                        marginLeft: '4px',
                        padding: '2px'
                    }} 
                />
            </div>
            <div>
            <button 
                id="buttonUploadBanner"
                className="px-5 text-md rounded-md" 
                style={{
                    color: textColor,
                    backgroundColor: roomColor.buttons.primary,
                }}
                onClick={async(e) => {uploadBannerFile(e);}}
            >Upload</button>
            </div>
            <div id="fileUploadingBanner" style={{display: 'none', fontSize: '10pt', }}>...uploading file...</div>
        </div>

        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
                About / Bio
            </div>
            <div className="flex justify-between">
                <textarea
                    className={mqp(
                        'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96 h-48'
                    )}
                    value={about}
                    name="about"
                    autoComplete="off"
                    style={{
                        fontSize: '15px',
                    }}
                    onBlur={async(e) => {
                        setAbout(e.target.value);
                    }}
                    onChange={e => {
                        setAbout(e.target.value);
                    }}                    
                ></textarea>
            </div>
        </div>

        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
                Lightning Address (LUD16)
            </div>
            <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                type="text"
                placeholder=""
                value={lud16 ?? ''}
                name="lud16"
                onChange={e => {
                    setLud16(e.target.value);
                }}
            />
        </div>

        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
                Nostr Address (NIP05)
            </div>
            <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                type="text"
                placeholder=""
                value={nip05 ?? ''}
                name="nip05"
                onChange={e => {
                    setNip05(e.target.value);
                }}
            />
        </div>

        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
                Website
            </div>
            <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                type="text"
                placeholder=""
                value={website ?? ''}
                name="website"
                onChange={e => {
                    setWebsite(e.target.value);
                }}
            />
        </div>

        {Object.keys(extraMetadata).length > 0 && (
        <div className="p-4 py-2 bg-gray-700 rounded-lg my-3 break-word">
            <div className="p-2 text-gray-200 bold">
                Other Metadata
            </div>
            {Object.keys(extraMetadata).map((key,index) => {
                let v = extraMetadata[key];
                if (typeof(v) == 'object') {
                    v = JSON.stringify(v,null,2);
                }
                return (
            <div className="p-2 text-gray-200 break-all">
                {key}: {v}
            </div>
                );
            })}
        </div>
        )}

        {showErrorMsg ? <p className="text-red-500">{showErrorMsg}</p> : null}

        <div className="flex">
            <button
                onClick={submit}
                className="flex-grow mt-5 h-12 px-6 text-lg rounded-lg"
                style={{
                    color: isDark(roomColor.buttons.primary)
                    ? roomColor.text.light
                    : roomColor.text.dark,
                    backgroundColor: roomColor.buttons.primary,
                }}
            >
                {isSaving ? <LoadingIcon /> : 'Save'}
            </button>
            <button
                onClick={cancel}
                className="flex-none mt-5 h-12 px-6 text-lg text-black bg-gray-100 rounded-lg focus:shadow-outline active:bg-gray-300"
            >
                Cancel
            </button>
        </div>
        </form>
    </Modal>
    );
}
