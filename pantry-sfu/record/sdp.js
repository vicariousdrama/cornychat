import { getCodecInfoFromRtpParameters } from './utils.js';

// File to create SDP text from mediasoup RTP Parameters
export const createSdpText = (rtpParameters) => {
  const { video, audio } = rtpParameters;

  return `v=0
  o=- 0 0 IN IP4 127.0.0.1
  s=FFmpeg
  c=IN IP4 127.0.0.1
  t=0 0
  ${video ? videoText(video) : ''}
  ${audio ? audioText(audio) : ''}
  `;
};

const audioText = (audio) => {
  // Audio codec info
  const audioCodecInfo = getCodecInfoFromRtpParameters('audio', audio.rtpParameters);

  return `m=audio ${audio.remoteRtpPort} RTP/AVP ${audioCodecInfo.payloadType} 
  a=rtpmap:${audioCodecInfo.payloadType} ${audioCodecInfo.codecName}/${audioCodecInfo.clockRate}/${audioCodecInfo.channels}
  a=sendonly
  `
};

const videoText = (video) => {
  // Audio codec info
  const videoCodecInfo = getCodecInfoFromRtpParameters('video', video.rtpParameters);

  return `m=video ${video.remoteRtpPort} RTP/AVP ${videoCodecInfo.payloadType} 
  a=rtpmap:${videoCodecInfo.payloadType} ${videoCodecInfo.codecName}/${videoCodecInfo.clockRate}
  a=sendonly
  `
};
