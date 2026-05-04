import { makeAutoObservable } from 'mobx';

import { VideoStore } from '../../video/stores/video.store';

export class HistoryViewModel {
  constructor(private readonly videoStore: VideoStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get records() {
    return this.videoStore.analysisHistory;
  }

  get isLoading() {
    return this.videoStore.isHistoryLoading;
  }

  get errorMessage() {
    return this.videoStore.error;
  }

  load() {
    return this.videoStore.loadAnalysisHistory();
  }
}
