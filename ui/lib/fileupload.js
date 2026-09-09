export {handleFileUpload};

async function handleFileUpload(fileObject) {
  let denyHandleFileUpload = sessionStorage.getItem('denyHandleFileUpload');
  const files = fileObject.files;
  let urls = [];
  if (!files.length) {
    return urls;
  }
  let filesUploaded = 0;
  const uploadUrl = 'https://nostr.build/api/v2/upload/files';
  const uploadMethod = 'POST';
  let doAuth = (localStorage.getItem(`fileUpload.auth`) ?? 'false') == 'true';
  let authHeader = undefined;
  if (denyHandleFileUpload) {
    let pr = confirm(
      'You previously rejected signing an event for file upload.\nUploads are blocked until you allow prompts to sign these events.\nDo you want to be prompted to sign for file uploads?'
    );
    denyHandleFileUpload = !pr;
    sessionStorage.setItem('denyHandleFileUpload', !pr);
  }
  if (!denyHandleFileUpload && doAuth && window.nostr) {
    try {
      const authEvent = {
        id: null,
        pubkey: null,
        created_at: Math.floor(Date.now() / 1000),
        kind: 27235,
        tags: [
          ['u', uploadUrl],
          ['method', uploadMethod],
        ],
        content: '',
        sig: null,
      };
      const signedAuthEvent = await window.nostr.signEvent(authEvent);
      let jsonAuthEvent = JSON.stringify(signedAuthEvent);
      let base64AuthEvent = btoa(jsonAuthEvent);
      authHeader = `Nostr: ${base64AuthEvent}`;
    } catch (error) {
      if (
        typeof error == 'object' &&
        error.message &&
        error.message.indexOf('denied') > -1
      ) {
        sessionStorage.setItem('denyHandleFileUpload', true);
      }
      alert('Upload cancelled');
      return urls;
    }
  } else {
    if (!doAuth || !window.nostr) {
      alert(
        'This feature is not supported without a NIP-07 extension for authenticating to nostr.build to associate the upload with your account'
      );
    }
    return urls;
  }
  const headers = authHeader ? {Authorization: authHeader} : {};
  for (let file of files) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      //docs: https://github.com/nostrbuild/nostr.build/blob/main/api/v2/routes_upload.php
      const response = await fetch(uploadUrl, {
        method: uploadMethod,
        body: formData,
        headers: headers,
      });
      const result = await response.json();
      if (result.status === 'success') {
        urls.push(result.data[0].url);
        filesUploaded += 1;
      }
    } catch (error) {
      console.log('An error occurred during file upload', error);
    }
  }
  return urls;
}
