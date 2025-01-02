export {handleFileUpload}

async function handleFileUpload (fileObject) {
    const files = fileObject.files; 
    let urls = [];
    if (!files.length) {return urls;} 
    let filesUploaded = 0;
    const uploadUrl = 'https://nostr.build/api/v2/upload/files';
    const uploadMethod = 'POST';
    let doAuth = ((localStorage.getItem(`fileUpload.auth`) ?? 'false') == 'true');
    let authHeader = undefined;
    if (doAuth && window.nostr) {
        const authEvent = {
            id: null,
            pubkey: null,
            created_at: Math.floor(Date.now() / 1000),
            kind: 27235,
            tags: [['u', uploadUrl],['method', uploadMethod]],
            content: '',
            sig: null,
        };
        const signedAuthEvent = await window.nostr.signEvent(authEvent);
        let jsonAuthEvent = JSON.stringify(signedAuthEvent);
        let base64AuthEvent = btoa(jsonAuthEvent);
        authHeader = `Nostr: ${base64AuthEvent}`;
    } else {
        alert('This feature is not supported without a NIP-07 extension for authenticating to nostr.build to associate the upload with your account');
        return;
    }
    const headers = (authHeader ? {'Authorization':authHeader} : {});
    for (let file of files) { 
        const formData = new FormData(); 
        formData.append('file', file); 
        try { 
            //docs: https://github.com/nostrbuild/nostr.build/blob/main/api/v2/routes_upload.php
            const response = await fetch(
                uploadUrl, 
                { method: uploadMethod, body: formData, headers: headers}
            );
            const result = await response.json(); 
            if (result.status === 'success') { 
                urls.push(result.data[0].url);
                filesUploaded += 1;
            } 
        } catch (error) { 
            console.log("An error occurred during file upload", error);
        } 
    }
    return urls;
};    