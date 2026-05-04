import * as ImagePicker from 'expo-image-picker';

import { VideoAsset } from '../../shared/types/video.types';

export class ExpoVideoPickerService {
  async pickVideo(): Promise<VideoAsset | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('MEDIA_LIBRARY_PERMISSION_DENIED');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ['videos'],
      quality: 1,
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });

    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      fileName: asset.fileName ?? `hook-score-${Date.now()}.mp4`,
      mimeType: asset.mimeType ?? 'video/mp4',
      durationMs: asset.duration ?? undefined,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    };
  }
}
