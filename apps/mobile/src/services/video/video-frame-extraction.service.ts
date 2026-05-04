import { Platform } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

import {
  PreparedVideoClip,
  VideoFrameSample,
} from '../../shared/types/video.types';

type NativeThumbnail = {
  uri: string;
  width?: number;
  height?: number;
};

const FRAME_IMAGE_MIME_TYPE = 'image/jpeg';
const FRAME_QUALITY = 0.72;

export class VideoFrameExtractionService {
  async extractOpeningFrames(clip: PreparedVideoClip): Promise<VideoFrameSample[]> {
    const timestamps = this.buildSampleTimestamps(clip);

    if (Platform.OS === 'web') {
      return this.extractWebFrames(clip, timestamps);
    }

    const frames: VideoFrameSample[] = [];

    for (const timestampMs of timestamps) {
      const thumbnail = await VideoThumbnails.getThumbnailAsync(clip.sourceUri, {
        time: timestampMs,
        quality: FRAME_QUALITY,
      });

      frames.push(await this.toFrameSample(thumbnail, timestampMs));
    }

    return frames;
  }

  private buildSampleTimestamps(clip: PreparedVideoClip) {
    const frameCount = Math.max(3, Math.min(5, Math.ceil(clip.windowDurationMs / 1000)));
    const lastOffsetMs = Math.max(0, clip.windowDurationMs - 250);

    return Array.from({ length: frameCount }, (_, index) => {
      const offsetMs =
        frameCount === 1 ? 0 : Math.round((lastOffsetMs * index) / (frameCount - 1));

      return clip.windowStartMs + offsetMs;
    });
  }

  private async toFrameSample(
    thumbnail: NativeThumbnail,
    timestampMs: number
  ): Promise<VideoFrameSample> {
    return {
      id: `frame-${timestampMs}`,
      timestampMs,
      imageDataUrl: await this.uriToDataUrl(thumbnail.uri),
      width: thumbnail.width,
      height: thumbnail.height,
    };
  }

  private async uriToDataUrl(uri: string): Promise<string> {
    if (uri.startsWith('data:')) {
      return this.normalizeDataUrl(uri);
    }

    const response = await fetch(uri);
    const blob = await response.blob();

    return this.blobToDataUrl(blob);
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('Video frame could not be encoded'));
      reader.onloadend = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        resolve(this.normalizeDataUrl(result));
      };
      reader.readAsDataURL(blob);
    });
  }

  private normalizeDataUrl(dataUrl: string) {
    if (dataUrl.startsWith('data:image/')) {
      return dataUrl;
    }

    const base64Value = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

    return `data:${FRAME_IMAGE_MIME_TYPE};base64,${base64Value}`;
  }

  private async extractWebFrames(
    clip: PreparedVideoClip,
    timestamps: number[]
  ): Promise<VideoFrameSample[]> {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = clip.sourceUri;

    await this.waitForVideoData(video);

    const canvas = document.createElement('canvas');
    const videoWidth = video.videoWidth || 720;
    const videoHeight = video.videoHeight || 1280;
    const scale = Math.min(1, 720 / Math.max(videoWidth, videoHeight));
    canvas.width = Math.max(1, Math.round(videoWidth * scale));
    canvas.height = Math.max(1, Math.round(videoHeight * scale));

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Video frame canvas could not be created');
    }

    const frames: VideoFrameSample[] = [];

    for (const timestampMs of timestamps) {
      await this.seekVideo(video, timestampMs / 1000);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      frames.push({
        id: `frame-${timestampMs}`,
        timestampMs,
        imageDataUrl: canvas.toDataURL(FRAME_IMAGE_MIME_TYPE, FRAME_QUALITY),
        width: canvas.width,
        height: canvas.height,
      });
    }

    video.removeAttribute('src');
    video.load();

    return frames;
  }

  private waitForVideoData(video: HTMLVideoElement) {
    return new Promise<void>((resolve, reject) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }

      const cleanup = () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
      };
      const handleLoadedData = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error('Video metadata could not be loaded'));
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.load();
    });
  }

  private seekVideo(video: HTMLVideoElement, targetSeconds: number) {
    return new Promise<void>((resolve, reject) => {
      const safeTargetSeconds = Math.min(
        Math.max(0, targetSeconds),
        Math.max(0, (video.duration || targetSeconds) - 0.05)
      );

      if (Math.abs(video.currentTime - safeTargetSeconds) < 0.01 && video.readyState >= 2) {
        resolve();
        return;
      }

      const cleanup = () => {
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };
      const handleSeeked = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error('Video frame could not be sampled'));
      };

      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);
      video.currentTime = safeTargetSeconds;
    });
  }
}
