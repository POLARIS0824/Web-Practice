# 音乐文件目录 (Music Directory)

你可以将下载好的音频文件（支持 `.ncm`, `.mp3`, `.m4a`, `.wav`, `.flac`, `.ogg` 等）直接放入当前文件夹：
`public/music/`

### 💡 支持网易云 .ncm 格式文件：
播放器内置了纯前端实时解密算法，**无需预先转码**。
如果你放入了网易云下载的 `.ncm` 文件（例如 `public/music/song1.ncm`）：
在 `playlist.ts` 中配置：
```typescript
export const PLAYLIST: Song[] = [
  {
    id: '1',
    title: '自动解析', // 播放器会自动解密并提取 NCM 内置的歌曲真实名称
    artist: '网易云音乐', // 播放器会自动读取真实歌手名
    src: '/music/song1.ncm',
  }
];
```

播放器将在内存中瞬间（约 30ms）解密并自动循环播放！
