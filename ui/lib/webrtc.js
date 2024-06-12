export async function canWebRTC() {
    return (window?.RTCPeerConnection || window?.mozRTCPeerConnection || window?.webkitRTCPeerConnection || false);
}