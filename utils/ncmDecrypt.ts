import aesjs from 'aes-js';

// NCM Fixed Keys
const CORE_KEY = new Uint8Array([
  0x68, 0x7a, 0x48, 0x52, 0x41, 0x6d, 0x73, 0x6f, 0x35, 0x6b, 0x49, 0x6e, 0x62, 0x61, 0x78, 0x57
]);

const META_KEY = new Uint8Array([
  0x23, 0x31, 0x34, 0x6c, 0x6a, 0x6b, 0x5f, 0x21, 0x5c, 0x5d, 0x26, 0x30, 0x55, 0x3c, 0x27, 0x28
]);

export interface DecryptedNcmResult {
  audioBlob: Blob;
  audioUrl: string;
  title?: string;
  artist?: string;
  album?: string;
  format?: string;
}

/**
 * 判断 ArrayBuffer 或前 8 字节是否为 NCM 格式 (Magic Header: CTENFDAM)
 */
export const isNcmBuffer = (buffer: ArrayBuffer): boolean => {
  if (buffer.byteLength < 8) return false;
  const view = new Uint8Array(buffer, 0, 8);
  return (
    view[0] === 0x43 &&
    view[1] === 0x54 &&
    view[2] === 0x45 &&
    view[3] === 0x4e &&
    view[4] === 0x46 &&
    view[5] === 0x44 &&
    view[6] === 0x41 &&
    view[7] === 0x4d
  );
};

/**
 * 实时解密 NCM ArrayBuffer
 */
export const decryptNcm = async (buffer: ArrayBuffer): Promise<DecryptedNcmResult> => {
  const bytes = new Uint8Array(buffer);
  const dataView = new DataView(buffer);
  let offset = 0;

  // 1. Check Magic Header (8 bytes)
  if (!isNcmBuffer(buffer)) {
    throw new Error('Not a valid NCM file (invalid header)');
  }
  offset += 8;

  // 2. Skip gap (2 bytes)
  offset += 2;

  // 3. Read & Decrypt RC4 Key
  const keyLen = dataView.getUint32(offset, true);
  offset += 4;

  const rawKeyData = new Uint8Array(keyLen);
  for (let i = 0; i < keyLen; i++) {
    rawKeyData[i] = bytes[offset + i] ^ 0x64;
  }
  offset += keyLen;

  const aesEcbCore = new aesjs.ModeOfOperation.ecb(CORE_KEY);
  const decryptedKey = aesjs.padding.pkcs7.strip(aesEcbCore.decrypt(rawKeyData));
  // Strip "neteasecloudmusic" prefix (17 bytes)
  const rc4Key = decryptedKey.slice(17);

  // 4. Build NCM Stream Key S-Box
  const sBox = new Uint8Array(256);
  for (let i = 0; i < 256; i++) sBox[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + sBox[i] + rc4Key[i % rc4Key.length]) & 0xff;
    const temp = sBox[i];
    sBox[i] = sBox[j];
    sBox[j] = temp;
  }

  // 5. Read Metadata (Optional)
  let title: string | undefined;
  let artist: string | undefined;
  let album: string | undefined;
  let format: string | undefined;

  const metaLen = dataView.getUint32(offset, true);
  offset += 4;

  if (metaLen > 0) {
    try {
      const rawMetaData = new Uint8Array(metaLen);
      for (let i = 0; i < metaLen; i++) {
        rawMetaData[i] = bytes[offset + i] ^ 0x63;
      }
      // Strip "163 key(Don't modify):" prefix (22 bytes)
      const base64Str = new TextDecoder().decode(rawMetaData.slice(22));
      const encryptedMeta = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
      const aesEcbMeta = new aesjs.ModeOfOperation.ecb(META_KEY);
      const decryptedMeta = aesjs.padding.pkcs7.strip(aesEcbMeta.decrypt(encryptedMeta));
      // Strip "music:" prefix (6 bytes)
      const metaJsonStr = new TextDecoder().decode(decryptedMeta.slice(6));
      const meta = JSON.parse(metaJsonStr);

      title = meta.musicName;
      if (meta.artist && Array.isArray(meta.artist)) {
        artist = meta.artist.map((a: any) => (Array.isArray(a) ? a[0] : a.name || a)).join(' / ');
      }
      album = meta.album;
      format = meta.format;
    } catch (e) {
      console.warn('Failed to parse NCM metadata:', e);
    }
  }
  offset += metaLen;

  // 6. Skip CRC & Gap (9 bytes total before image length)
  offset += 9;

  // 7. Skip Album Image
  const imgLen = dataView.getUint32(offset, true);
  offset += 4;
  offset += imgLen;

  // 8. Decrypt Audio Stream Data
  const audioLength = bytes.length - offset;
  const audioDecrypted = new Uint8Array(audioLength);
  for (let i = 0; i < audioLength; i++) {
    const k = (i + 1) & 0xff;
    audioDecrypted[i] = bytes[offset + i] ^ sBox[(sBox[k] + sBox[(sBox[k] + k) & 0xff]) & 0xff];
  }

  // 9. Detect MIME type (FLAC / MP3 / AAC)
  let mimeType = 'audio/mpeg';
  if (
    audioDecrypted.length >= 4 &&
    audioDecrypted[0] === 0x66 && // 'f'
    audioDecrypted[1] === 0x4c && // 'L'
    audioDecrypted[2] === 0x61 && // 'a'
    audioDecrypted[3] === 0x43    // 'C'
  ) {
    mimeType = 'audio/flac';
    format = format || 'flac';
  } else {
    mimeType = 'audio/mpeg';
    format = format || 'mp3';
  }

  const audioBlob = new Blob([audioDecrypted], { type: mimeType });
  const audioUrl = URL.createObjectURL(audioBlob);

  return {
    audioBlob,
    audioUrl,
    title,
    artist,
    album,
    format,
  };
};
