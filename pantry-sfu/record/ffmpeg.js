// Class to handle child process used for running FFmpeg

import child_process from 'child_process';
import {EventEmitter} from 'events';

import {createSdpText} from './sdp.js';
import {convertStringToStream} from './utils.js';

export default class FFmpeg {
  constructor(rtpParameters, peer, debug = false) {
    this._peer = peer;
    this._debug = debug;
    this._rtpParameters = rtpParameters;
    this._process = undefined;
    this._observer = new EventEmitter();
    this._peerSlug = peer.id.substring(0, 5);
    this._createProcess();
  }

  _createProcess() {
    const peerSlug = this._peerSlug;

    const sdpString = createSdpText(this._rtpParameters);
    const sdpStream = convertStringToStream(sdpString);

    if (this._debug)
      console.log(
        `ffmpeg::process::create::${peerSlug} [sdpString:%s]`,
        sdpString
      );

    console.log(`ffmpeg::process::start::${peerSlug} [peer: ${this._peer.id}]`);
    this._process = child_process.spawn('ffmpeg', this._commandArgs);

    if (this._process.stderr) {
      this._process.stderr.setEncoding('utf-8');

      this._process.stderr.on('data', data => {
        if (this._debug) {
          console.log(`ffmpeg::process::data::${peerSlug} [data:%o]`, data);
        }
      });
    }

    if (this._process.stdout) {
      this._process.stdout.setEncoding('utf-8');

      this._process.stdout.on('data', data => {
        if (this._debug) {
          console.log(`ffmpeg::process::data::${peerSlug} [data:%o]`, data);
        }
      });
    }

    this._process.on('message', message =>
      console.log(`ffmpeg::process::message::${peerSlug} [message:%o]`, message)
    );

    this._process.on('error', error =>
      console.error(`ffmpeg::process::error::${peerSlug} [error:%o]`, error)
    );

    this._process.once('close', () => {
      console.log(
        `ffmpeg::process::close::${peerSlug} [peer: ${this._peer.id}]`
      );
      this._observer.emit('process-close');
    });

    sdpStream.on('error', error =>
      console.error(`sdpStream::error::${peerSlug} [error:%o]`, error)
    );

    // Pipe sdp stream to the ffmpeg process
    sdpStream.resume();
    sdpStream.pipe(this._process.stdin);
  }

  kill() {
    console.log(
      `ffmpeg::process::kill::${this._peerSlug} [pid:%d]`,
      this._process.pid
    );
    this._process.kill('SIGINT');
  }

  get _commandArgs() {
    let commandArgs = [
      '-loglevel',
      'debug',
      '-protocol_whitelist',
      'pipe,udp,rtp',
      '-fflags',
      '+genpts',
      '-f',
      'sdp',
      '-i',
      'pipe:0',
    ];

    if (this._rtpParameters.target === 'record') {
      commandArgs = commandArgs.concat(this._videoArgsRecord);
      commandArgs = commandArgs.concat(this._audioArgsRecord);
    } else {
      commandArgs = commandArgs.concat(this._videoArgsStream);
      commandArgs = commandArgs.concat(this._audioArgsStream);
      commandArgs = commandArgs.concat(this._hlsArgs);
    }

    commandArgs = commandArgs.concat([this._rtpParameters.destination]);

    if (this._debug) console.log('commandArgs:%o', commandArgs);

    return commandArgs;
  }

  get _videoArgsRecord() {
    return ['-map', '0:v:0?', '-c:v', 'copy'];
  }

  get _videoArgsStream() {
    return [
      '-map',
      '0:v:0?',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '21',
      '-g',
      '25',
      '-sc_threshold',
      '0',
    ];
  }

  get _audioArgsRecord() {
    return [
      '-map',
      '0:a:0?',
      '-strict', // libvorbis is experimental
      '-2',
      '-c:a',
      'copy',
    ];
  }

  get _audioArgsStream() {
    return ['-map', '0:a:0?', '-c:a', 'aac', '-b:a', '128k', '-ac', '2'];
  }

  get _hlsArgs() {
    return [
      '-f',
      'hls',
      '-hls_time',
      '2',
      '-hls_segment_type',
      'fmp4',
      '-master_pl_name',
      'index.m3u8',
    ];
  }
}
