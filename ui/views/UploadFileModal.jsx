import React, {useState} from 'react';
import {Modal} from './Modal';
import {isDark} from '../lib/theme';
import {useJam} from '../jam-core-react';

export const UploadFileModal = ({
    close,
    roomColor,
    objectValue,
    setObjectValue,
}) => {

    const [state, api] = useJam();
    const textColor = isDark(roomColor.buttons.primary) ? roomColor.text.light : roomColor.text.dark;

    let uploadFile = async e => {
        e.preventDefault();
        const files = modalFileUpload.files; 
        if (!files.length) {return;} 
        let filesUploaded = 0;
        let newValue = objectValue;
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
                    const fileUrl = result.data[0].url;
                    newValue = newValue + ' ' + fileUrl;
                    setObjectValue(newValue);
                    filesUploaded += 1;
                } else { 
                    alert('Upload failed. Please try again.'); 
                } 
            } catch (error) { 
                alert('An error occurred during the upload. Please try again.');
            } 
        }
        if (filesUploaded == files.length) {
            close();
        }
    };

    return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Upload File</h2>
        <div className="p-2 text-gray-200 bold">
            Files will be uploaded to nostr.build and the resulting url will be appended to the end of the text chat input field
        </div>
        <div className="flex justify-between">
          <input type="file" name="upload" id="modalFileUpload" accept="image/*" 
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
            className="px-5 text-md rounded-md" 
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={async(e) => {uploadFile(e);}}
          >Upload</button>
        </div>
      </div>  
    </Modal>
    );
};
