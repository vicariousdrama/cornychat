import {getPort, releasePort} from './port.js';
import fs from 'fs/promises';
import path from 'path';
import {
  distributionHost,
  recordFileLocationPath,
  hlsFileLocationPath,
} from '../config.js';
import FFmpeg from './ffmpeg.js';

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

export const startStreaming = async (
  peer,
  room,
  source,
  announcedIp,
  debug = false
) => {
  console.log(`Start streaming for ${peer.id}, source ${source}`);

  const streamInfo = {};

  const stream = {
    remotePorts: [],
    consumerIds: [],
    process: null,
    info: null,
  };
  peer.streams.set(source, stream);

  for (const [_, producer] of peer.producers) {
    if (producer.appData.source !== source) {
      continue;
    }

    if (debug) {
      console.log('PRODUCER', producer);
    }

    const {rtpTransport, remoteRtpPort} = await createPeerRtpTransport(
      peer,
      stream,
      room.router,
      announcedIp
    );

    console.log('Transport created.');

    streamInfo[producer.kind] = {
      ...(await publishProducerRtpStream(
        peer,
        stream,
        producer,
        room.router,
        rtpTransport
      )),
      remoteRtpPort,
    };
  }

  stream.info = streamInfo;

  if (distributionHost) {
    await startDistributing(peer, room, source, debug);
  }
};

const startDistributing = async (peer, room, source, debug = false) => {
  console.log(`Start distributing for ${peer.id}, source ${source}`);

  const fileDirectory = path.join(
    hlsFileLocationPath,
    room.id,
    peer.id.split('.')[0],
    source
  );
  await fs.mkdir(fileDirectory, {recursive: true});

  const streamingPath = `${room.id}-${peer.id.split('.')[0]}-${source}`;

  const stream = peer.streams.get(source);

  console.log(streamingPath);

  const recordInfo = {
    ...stream.info,
    destination: path.join(fileDirectory, 'index%v.m3u8'),
  };

  stream.process = new FFmpeg(recordInfo, peer, debug);

  setTimeout(async () => {
    peer.streams.get(source).consumerIds.forEach(async id => {
      await peer.consumers.get(id).resume();
      await peer.consumers.get(id).requestKeyFrame();
    });
  }, 1000);
};
export const startRecording = async (peer, room, source, debug = false) => {
  console.log(`Start recording for ${peer.id}, source ${source}`);

  const fileDirectory = path.join(
    recordFileLocationPath,
    room.id,
    peer.id.split('.')[0],
    source
  );
  await fs.mkdir(fileDirectory, {recursive: true});

  const stream = peer.streams.get(source);

  const recording = {
    process: null,
  };

  const recordInfo = {
    ...stream.info,
    destination: path.join(fileDirectory, `${Date.now()}.webm`),
    target: 'record',
  };

  recording.process = new FFmpeg(recordInfo, peer, debug);

  peer.recordings.set(source, recording);

  setTimeout(async () => {
    stream.consumerIds.forEach(async id => {
      await peer.consumers.get(id).resume();
      await peer.consumers.get(id).requestKeyFrame();
    });
  }, 1000);
};

export const stopStreaming = async (peer, source) => {
  console.log(`Stop streaming for ${peer.id}, source ${source}`);

  const stream = peer.streams.get(source);

  if (!stream) {
    console.log('Nothing to stop.');
    return;
  }

  stream.consumerIds.forEach(id => peer.consumers.delete(id));

  for (const remotePort of stream.remotePorts) {
    releasePort(remotePort);
  }

  peer.streams.delete(source);
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

  peer.recordings.delete(source);
};
