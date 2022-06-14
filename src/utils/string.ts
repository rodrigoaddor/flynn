export const truncate = (input: string, maxSize: number) => {
  if (input.length <= maxSize) return input;
  return input.substring(0, maxSize - 3) + '...';
};

export const isUrl = (input: string): boolean => {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};
