import { Platform } from 'react-native';

import {
  PreparedVideoClip,
  VideoAudioSample,
} from '../../shared/types/video.types';

const AUDIO_MIME_TYPE = 'audio/wav';
const TARGET_SAMPLE_RATE = 16000;
const TARGET_CHANNEL_COUNT = 1;
const BITS_PER_SAMPLE = 16;

type AudioContextConstructor = typeof AudioContext;

type AudioContextGlobal = typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor;
};

export class VideoAudioExtractionService {
  async extractOpeningAudio(clip: PreparedVideoClip): Promise<VideoAudioSample | null> {
    if (Platform.OS !== 'web') {
      return null;
    }

    const AudioContextCtor = this.getAudioContextConstructor();

    if (!AudioContextCtor) {
      return null;
    }

    try {
      return await this.extractWebWavAudio(clip, AudioContextCtor);
    } catch {
      return null;
    }
  }

  private getAudioContextConstructor() {
    const audioGlobal = globalThis as AudioContextGlobal;

    return audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
  }

  private async extractWebWavAudio(
    clip: PreparedVideoClip,
    AudioContextCtor: AudioContextConstructor
  ): Promise<VideoAudioSample | null> {
    const response = await fetch(clip.sourceUri);

    if (!response.ok) {
      return null;
    }

    const fileBuffer = await response.arrayBuffer();
    const audioContext = new AudioContextCtor();

    try {
      const audioBuffer = await audioContext.decodeAudioData(fileBuffer.slice(0));
      const pcmSamples = this.extractMonoPcmWindow(audioBuffer, clip);

      if (!pcmSamples) {
        return null;
      }

      const wavBytes = this.encodeWav(pcmSamples.samples, TARGET_SAMPLE_RATE);

      return {
        id: `audio-${clip.windowStartMs}-${clip.windowDurationMs}`,
        startMs: clip.windowStartMs,
        durationMs: pcmSamples.durationMs,
        mimeType: AUDIO_MIME_TYPE,
        base64Data: this.bytesToBase64(wavBytes),
        sampleRate: TARGET_SAMPLE_RATE,
        channelCount: TARGET_CHANNEL_COUNT,
      };
    } finally {
      if (audioContext.state !== 'closed') {
        void audioContext.close();
      }
    }
  }

  private extractMonoPcmWindow(audioBuffer: AudioBuffer, clip: PreparedVideoClip) {
    const sourceSampleRate = audioBuffer.sampleRate;
    const sourceChannelCount = audioBuffer.numberOfChannels;

    if (sourceSampleRate <= 0 || sourceChannelCount <= 0 || audioBuffer.length <= 0) {
      return null;
    }

    const startFrame = Math.min(
      audioBuffer.length,
      Math.max(0, Math.floor((clip.windowStartMs / 1000) * sourceSampleRate))
    );
    const requestedFrameCount = Math.floor((clip.windowDurationMs / 1000) * sourceSampleRate);
    const endFrame = Math.min(audioBuffer.length, startFrame + requestedFrameCount);

    if (endFrame <= startFrame) {
      return null;
    }

    const durationSeconds = (endFrame - startFrame) / sourceSampleRate;
    const targetFrameCount = Math.max(1, Math.ceil(durationSeconds * TARGET_SAMPLE_RATE));
    const channelData = Array.from({ length: sourceChannelCount }, (_, channelIndex) =>
      audioBuffer.getChannelData(channelIndex)
    );
    const samples = new Float32Array(targetFrameCount);

    for (let targetIndex = 0; targetIndex < targetFrameCount; targetIndex += 1) {
      const sourcePosition = startFrame + (targetIndex / TARGET_SAMPLE_RATE) * sourceSampleRate;
      const sourceIndex = Math.min(endFrame - 1, Math.floor(sourcePosition));
      const nextSourceIndex = Math.min(endFrame - 1, sourceIndex + 1);
      const interpolation = sourcePosition - sourceIndex;
      let sample = 0;

      for (const channel of channelData) {
        sample += channel[sourceIndex] + (channel[nextSourceIndex] - channel[sourceIndex]) * interpolation;
      }

      samples[targetIndex] = this.clampSample(sample / sourceChannelCount);
    }

    return {
      samples,
      durationMs: Math.round(durationSeconds * 1000),
    };
  }

  private encodeWav(samples: Float32Array, sampleRate: number) {
    const bytesPerSample = BITS_PER_SAMPLE / 8;
    const dataByteLength = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataByteLength);
    const view = new DataView(buffer);
    let offset = 0;

    offset = this.writeAscii(view, offset, 'RIFF');
    view.setUint32(offset, 36 + dataByteLength, true);
    offset += 4;
    offset = this.writeAscii(view, offset, 'WAVE');
    offset = this.writeAscii(view, offset, 'fmt ');
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, TARGET_CHANNEL_COUNT, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, sampleRate * TARGET_CHANNEL_COUNT * bytesPerSample, true);
    offset += 4;
    view.setUint16(offset, TARGET_CHANNEL_COUNT * bytesPerSample, true);
    offset += 2;
    view.setUint16(offset, BITS_PER_SAMPLE, true);
    offset += 2;
    offset = this.writeAscii(view, offset, 'data');
    view.setUint32(offset, dataByteLength, true);
    offset += 4;

    for (const sample of samples) {
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += bytesPerSample;
    }

    return new Uint8Array(buffer);
  }

  private writeAscii(view: DataView, offset: number, value: string) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }

    return offset + value.length;
  }

  private bytesToBase64(bytes: Uint8Array) {
    let binary = '';
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
      const chunk = bytes.subarray(index, index + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  }

  private clampSample(sample: number) {
    return Math.max(-1, Math.min(1, sample));
  }
}
