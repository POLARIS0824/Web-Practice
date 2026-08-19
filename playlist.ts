import { Song } from './types';

/**
 * 🎵 播放列表配置 (Playlist Configuration)
 * 
 * 支持的音频格式：
 * - .ncm (网易云加密音频，纯前端实时秒级解密，支持自动解析内置歌名与歌手)
 * - .mp3 / .wav / .m4a / .flac / .ogg
 */
export const PLAYLIST: Song[] = [
  {
    id: '1',
    title: '遇见',
    artist: '孙燕姿',
    src: '/music/遇见 - 孙燕姿.ncm',
  },
  {
    id: '2',
    title: '慢慢喜欢你',
    artist: '莫文蔚',
    src: '/music/慢慢喜欢你 - 莫文蔚.ncm',
  },
  {
    id: '3',
    title: '我要的幸福',
    artist: '孙燕姿',
    src: '/music/我要的幸福 - 孙燕姿.ncm',
  },
  {
    id: '4',
    title: '第一天',
    artist: '孙燕姿',
    src: '/music/第一天 - 孙燕姿.ncm',
  },
  {
    id: '5',
    title: '夏天的风',
    artist: '火羊瞌睡了',
    src: '/music/夏天的风 - 火羊瞌睡了.ncm',
  },
  {
    id: '6',
    title: '多远都要在一起',
    artist: 'G.E.M.邓紫棋',
    src: '/music/多远都要在一起 - G.E.M.邓紫棋.ncm',
  },
  {
    id: '7',
    title: '小宇',
    artist: '张震岳',
    src: '/music/小宇 - 张震岳.ncm',
  },
  {
    id: '8',
    title: '传奇',
    artist: '王菲',
    src: '/music/传奇 - 王菲.ncm',
  },
  {
    id: '9',
    title: '至少还有你',
    artist: '林忆莲',
    src: '/music/至少还有你 - 林忆莲.ncm',
  },
  {
    id: '10',
    title: 'Happiness is a butterfly',
    artist: 'Lana Del Rey',
    src: '/music/Happiness is a butterfly - Lana Del Rey.ncm',
  },
  {
    id: '11',
    title: 'Take Me To Your Heart',
    artist: 'Michael Learns To Rock',
    src: '/music/Take Me To Your Heart - Michael Learns To Rock.ncm',
  },
];
