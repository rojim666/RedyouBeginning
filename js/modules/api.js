
// API 统一管理模块

// 一言 API (每日一言)
export async function fetchQuote() {
  const response = await fetch('https://api.nxvav.cn/api/yiyan/?encode=json&charset=utf-8');
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return await response.json();
}

// OpenStreetMap Nominatim API (地理位置反向解析)
export async function fetchLocationName(latitude, longitude) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=zh-CN`,
    {
      headers: {
        'User-Agent': 'StartPage/1.0'
      }
    }
  );
  
  if (!response.ok) throw new Error('Location fetch failed');
  return await response.json();
}

// Open-Meteo API (天气数据)
export async function fetchWeather(latitude, longitude) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=uv_index_max,sunrise,sunset&timezone=auto`
  );
  
  if (!response.ok) throw new Error('Weather fetch failed');
  return await response.json();
}

// 网易云音乐 API (支持自定义、主线路和备用线路)
export async function fetchMusicPlaylist(id, customApi = null, customCookie = null) {
  // 1. 尝试自定义 API
  if (customApi) {
    try {
      let playlistUrl = `${customApi}/playlist/track/all?id=${id}&limit=1000&offset=0`;
      if (customCookie) {
        playlistUrl += `&cookie=${encodeURIComponent(customCookie)}`;
      }
      
      const response = await fetch(playlistUrl);
      if (!response.ok) throw new Error(`自定义 API HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.songs && Array.isArray(data.songs)) {
        const trackIds = data.songs.map(s => s.id).join(',');
        let songUrlApi = `${customApi}/song/url?id=${trackIds}`;
        if (customCookie) songUrlApi += `&cookie=${encodeURIComponent(customCookie)}`;
        
        const urlResponse = await fetch(songUrlApi);
        const urlData = await urlResponse.json();
        const urlMap = {};
        if (urlData.data) {
          urlData.data.forEach(u => urlMap[u.id] = u.url);
        }
        
        return data.songs.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.ar ? track.ar.map(a => a.name).join('/') : '未知歌手',
          album: track.al ? track.al.name : '未知专辑',
          duration: track.dt,
          url: urlMap[track.id],
          cover: track.al ? track.al.picUrl : null,
          lrc: null
        })).filter(t => t.url);
      }
    } catch (error) {
      console.warn('自定义 API 获取失败，尝试默认线路:', error);
    }
  }
  
  // 2. 尝试主线路 API (i-meto)
  try {
    const apiUrl = `https://api.i-meto.com/meting/api?server=netease&type=playlist&id=${id}`;
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((track, index) => ({
          id: index,
          name: track.title || '未知歌曲',
          artist: track.author || '未知歌手',
          album: '在线音乐',
          duration: 0,
          url: track.url,
          cover: track.pic,
          lrc: track.lrc
        }));
      }
    }
  } catch (error) {
    console.warn('主线路 API 获取失败，尝试备用线路:', error);
  }
  
  // 3. 尝试备用线路 API (injahow)
  try {
    const apiUrl = `https://api.injahow.cn/meting/?type=playlist&id=${id}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) throw new Error(`备用 API HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return data.map((track, index) => ({
        id: index,
        name: track.name || track.title || '未知歌曲',
        artist: track.artist || track.author || '未知歌手',
        album: '在线音乐',
        duration: 0,
        url: track.url,
        cover: track.pic || track.cover,
        lrc: track.lrc
      }));
    }
  } catch (error) {
    console.error('所有 API 线路均失败:', error);
    throw error;
  }
  
  return [];
}
