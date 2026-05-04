export function formatMilliseconds(ms?: number) {
  if (!ms || ms <= 0) {
    return '0.0s';
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

export function shortUri(uri: string) {
  if (uri.length <= 44) {
    return uri;
  }

  return `${uri.slice(0, 20)}...${uri.slice(-18)}`;
}
