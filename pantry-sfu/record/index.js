import {getPort, releasePort} from './port.js';
import fs from 'fs/promises';
import path from 'path';
import FFmpeg from './ffmpeg.js';

const RECORD_FILE_LOCATION_PATH =
  process.env.RECORD_FILE_LOCATION_PATH || './records';

const createPeerRtpTransport = async (peer, recording, router, announcedIp) => {
  console.log('Creating peer RtpTransport');

  const rtpTransportConfig = {
    listenIp: {ip: '0.0.0.0', announcedIp: announcedIp}, // TODO: Change announcedIp to your external IP or domain name
    rtcpMux: true,
    comedia: false,
  };

  const rtpTransport = await router.createPlainTransport(rtpTransportConfig);

  // Set the receiver RTP ports
  const remoteRtpPort = await getPort();
  recording.remotePorts.push(remoteRtpPort);

  await rtpTransport.connect({
    ip: '127.0.0.1',
    port: remoteRtpPort,
  });

  peer.transports.set(rtpTransport.id, rtpTransport);

  return {
    remoteRtpPort,
    rtpTransport,
  };
};
const publishProducerRtpStream = async (
  peer,
  recording,
  producer,
  router,
  rtpTransport
) => {
  const codecs = [];
  // Codec passed to the RTP Consumer must match the codec in the Mediasoup router rtpCapabilities
  const routerCodec = router.rtpCapabilities.codecs.find(
    codec => codec.kind === producer.kind
  );
  codecs.push(routerCodec);

  const rtpCapabilities = {
    codecs,
    rtcpFeedback: [],
  };

  const rtpConsumer = await rtpTransport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: true,
  });

  peer.consumers.set(rtpConsumer.id, rtpConsumer);

  recording.consumerIds.push(rtpConsumer.id);

  return {
    rtpCapabilities,
    rtpParameters: rtpConsumer.rtpParameters,
  };
};

export const startRecording = async (
  peer,
  room,
  source,
  announcedIp,
  debug = false
) => {
  console.log(`Start recording for ${peer.id}, source ${source}`);

  const recordInfo = {};

  const recording = {
    remotePorts: [],
    consumerIds: [],
    process: null,
  };
  peer.recordings.set(source, recording);

  for (const [_, producer] of peer.producers) {
    if (producer.appData.source !== source) {
      continue;
    }

    if (debug) {
      console.log('PRODUCER', producer);
    }

    const {rtpTransport, remoteRtpPort} = await createPeerRtpTransport(
      peer,
      recording,
      room.router,
      announcedIp
    );

    console.log('Transport created.');
    recordInfo[producer.kind] = {
      ...(await publishProducerRtpStream(
        peer,
        recording,
        producer,
        room.router,
        rtpTransport
      )),
      remoteRtpPort,
    };
  }

  const fileDirectory = path.join(
    RECORD_FILE_LOCATION_PATH,
    room.id,
    peer.id.split('.')[0],
    source
  );
  await fs.mkdir(fileDirectory, {recursive: true});

  recordInfo.filePath = path.join(fileDirectory, `${Date.now()}.webm`);

  recording.process = new FFmpeg(recordInfo, peer, debug);

  setTimeout(async () => {
    recording.consumerIds.forEach(async id => {
      await peer.consumers.get(id).resume();
      await peer.consumers.get(id).requestKeyFrame();
    });
  }, 1000);
};

export const stopRecording = async (peer, source) => {
  console.log(`Stop recording for ${peer.id}, source ${source}`);

  const recording = peer.recordings.get(source);

  if (!recording) {
    console.log('Nothing to stop.');
    return;
  }

  if (recording.process) {
    recording.process.kill();
  }

  recording.consumerIds.forEach(id => peer.consumers.delete(id));

  // Release ports from port set
  for (const remotePort of recording.remotePorts) {
    releasePort(remotePort);
  }

  peer.recordings.delete(source);
};
