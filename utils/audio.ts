/**
 * Decodes a base64 encoded string into a Uint8Array of bytes.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw 16-bit signed PCM audio data into an AudioBuffer.
 * The Gemini API returns little-endian PCM data.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Use DataView to safely read 16-bit integers regardless of memory alignment
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const frameCount = Math.floor(data.byteLength / (2 * numChannels));
  const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Index calculation: (frameIndex * totalChannels + currentChannel) * 2 bytes
      const byteOffset = (i * numChannels + channel) * 2;
      // Read 16-bit signed integer (little-endian: true)
      const int16Value = view.getInt16(byteOffset, true);
      // Normalize to float range [-1.0, 1.0]
      channelData[i] = int16Value / 32768.0;
    }
  }
  return audioBuffer;
}

/**
 * Encodes a Uint8Array of bytes into a base64 string.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}