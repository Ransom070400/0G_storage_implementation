export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const truncateName = (name: string, max = 32): string =>
  name.length > max ? `${name.slice(0, max - 6)}...${name.slice(-6)}` : name;

export const truncateHash = (hash: string, chars = 8): string =>
  hash.length > chars * 2 + 2
    ? `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`
    : hash;

export const fileTypeIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return '📦';
  if (type.includes('json') || type.includes('javascript') || type.includes('typescript')) return '⚙';
  if (type.includes('text')) return '📝';
  return '📁';
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
