// API模块
async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// 每日一言
export async function fetchQuote() {
  return fetchJson('https://api.nxvav.cn/api/yiyan/?encode=json&charset=utf-8');
}

// 地理位置解析
export async function fetchLocationName(lat, lon) {
  return fetchJson(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-CN`,
    { headers: { 'User-Agent': 'StartPage/1.0' } }
  );
}

// 天气数据
export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
    daily: 'uv_index_max,sunrise,sunset',
    timezone: 'auto'
  });
  return fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);
}

// 网易云音乐 API
export async function fetchMusicPlaylist(id, customApi = null, customCookie = null) {
  const publicNodes = [
    `https://api.i-meto.com/meting/api?server=netease&type=playlist&id=${id}`,
    `https://api.injahow.cn/meting/?type=playlist&id=${id}`
  ];

  for (const url of publicNodes) {
    try {
      const data = await fetchJson(url);
      if (Array.isArray(data) && data.length > 0) {
        return data.map(normalizeMetingTrack);
      }
    } catch (e) {
      continue;
    }
  }

  return [];
}

async function fetchFromCustomApi(id, host, cookie) {
  const appendCookie = (url) => cookie ? `${url}&cookie=${encodeURIComponent(cookie)}` : url;
  
  const playlistUrl = appendCookie(`${host}/playlist/track/all?id=${id}&limit=1000&offset=0`);
  const playlist = await fetchJson(playlistUrl);
  
  if (!playlist.songs?.length) return [];

  const trackIds = playlist.songs.map(s => s.id).join(',');
  const songUrl = appendCookie(`${host}/song/url?id=${trackIds}`);
  const urls = await fetchJson(songUrl);
  
  const urlMap = new Map(urls.data?.map(u => [u.id, u.url]) || []);

  return playlist.songs
    .filter(song => urlMap.get(song.id))
    .map(song => ({
      id: song.id,
      name: song.name,
      artist: song.ar?.map(a => a.name).join('/') || '未知歌手',
      album: song.al?.name || '未知专辑',
      cover: song.al?.picUrl,
      url: urlMap.get(song.id),
      lrc: null
    }));
}

function normalizeMetingTrack(track, index) {
  return {
    id: track.id || index,
    name: track.name || track.title || '未知歌曲',
    artist: track.artist || track.author || '未知歌手',
    album: '在线音乐',
    cover: track.pic || track.cover,
    url: track.url,
    lrc: track.lrc
  };
}
