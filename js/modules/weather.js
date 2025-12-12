import { $, showToast } from './utils.js';
import { fetchWeather, fetchLocationName } from '../api/api.js';

let weatherData = null;

// emoji好丑啊
const WEATHER_MAP = {
  0: { icon: '☀️', desc: '晴朗' },
  1: { icon: '🌤️', desc: '晴朗' },
  2: { icon: '⛅', desc: '多云' },
  3: { icon: '☁️', desc: '阴天' },
  45: { icon: '🌫️', desc: '有雾' }, 48: { icon: '🌫️', desc: '有雾' },
  51: { icon: '🌧️', desc: '小雨' }, 53: { icon: '🌧️', desc: '中雨' }, 55: { icon: '🌧️', desc: '大雨' },
  61: { icon: '🌧️', desc: '小雨' }, 63: { icon: '🌧️', desc: '中雨' }, 65: { icon: '🌧️', desc: '大雨' },
  71: { icon: '❄️', desc: '小雪' }, 73: { icon: '❄️', desc: '中雪' }, 75: { icon: '❄️', desc: '大雪' },
  77: { icon: '❄️', desc: '雨夹雪' },
  80: { icon: '🌧️', desc: '阵雨' }, 81: { icon: '⛈️', desc: '雷阵雨' }, 82: { icon: '⛈️', desc: '强雷阵雨' },
  85: { icon: '🌨️', desc: '阵雪' }, 86: { icon: '🌨️', desc: '大阵雪' },
  95: { icon: '⛈️', desc: '雷暴' }, 96: { icon: '⛈️', desc: '冰雹' }, 99: { icon: '⛈️', desc: '强冰雹' }
};

export function initWeather() {
  const weatherEl = $('#weather');
  if (!weatherEl) return;
  
  weatherEl.addEventListener('click', showWeatherCard);
  $('#closeWeatherCard')?.addEventListener('click', closeWeatherCard);
  $('#weatherOverlay')?.addEventListener('click', closeWeatherCard);
  
  loadCachedWeather();
  getWeather();
  setInterval(getWeather, 30 * 60 * 1000);
}

function loadCachedWeather() {
  const saved = localStorage.getItem('startpage.weather');
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    if (Date.now() - data.timestamp < 3600000) { // 1 hour cache
      weatherData = data;
      renderWeatherWidget();
    }
  } catch (e) {
    console.error('Cache parse error:', e);
  }
}
// 获取位置
async function getLocationName(lat, lon) {
  try {
    const { address } = await fetchLocationName(lat, lon);
    return address.city || address.county || address.state || '未知位置';
  } catch (e) {
    return '当前位置';
  }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('No geolocation support'));
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

async function getWeather() {
  try {
    const position = await getPosition();
    const { latitude, longitude } = position.coords;
    
    const [locationName, data] = await Promise.all([
      getLocationName(latitude, longitude),
      fetchWeather(latitude, longitude)
    ]);

    const { current, daily } = data;
    const code = current.weather_code;
    const weatherInfo = WEATHER_MAP[code] || { icon: '🌡', desc: '未知' };

    weatherData = {
      location: locationName,
      temp: Math.round(current.temperature_2m),
      code,
      icon: weatherInfo.icon,
      description: weatherInfo.desc,
      humidity: current.relative_humidity_2m,
      feelsLike: Math.round(current.apparent_temperature),
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: getWindDirection(current.wind_direction_10m),
      uvIndex: daily.uv_index_max[0],
      uvLevel: getUVLevel(daily.uv_index_max[0]),
      sunrise: formatTime(daily.sunrise[0]),
      sunset: formatTime(daily.sunset[0]),
      visibility: 10,
      updateTime: new Date().toLocaleString('zh-CN', { 
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
      }),
      timestamp: Date.now()
    };
    
    localStorage.setItem('startpage.weather', JSON.stringify(weatherData));
    renderWeatherWidget();
  } catch (error) {
    console.error('Weather update failed:', error);
    renderWeatherError('获取失败');
  }
}

function renderWeatherWidget() {
  if (!weatherData) return;
  $('#weatherIcon').textContent = weatherData.icon;
  $('#weatherTemp').textContent = `${weatherData.temp}°C`;
}

function renderWeatherError(msg) {
  $('#weatherTemp').textContent = msg;
}

function showWeatherCard() {
  if (!weatherData) {
    showToast('数据加载中喵...');
    getWeather();
    return;
  }
  
  const fields = {
    '#weatherLocation': weatherData.location,
    '#weatherCardIcon': weatherData.icon,
    '#weatherCardTemp': `${weatherData.temp}°C`,
    '#weatherCardDesc': weatherData.description,
    '#weatherWindSpeed': `${weatherData.windSpeed} km/h`,
    '#weatherHumidity': `${weatherData.humidity}%`,
    '#weatherFeelsLike': `${weatherData.feelsLike}°C`,
    '#weatherVisibility': `${weatherData.visibility} km`,
    '#weatherUV': `${weatherData.uvIndex} (${weatherData.uvLevel})`,
    '#weatherSunrise': weatherData.sunrise,
    '#weatherSunset': weatherData.sunset,
    '#weatherWindDir': weatherData.windDirection,
    '#weatherUpdateTime': `更新时间：${weatherData.updateTime}`
  };

  Object.entries(fields).forEach(([selector, value]) => {
    $(selector).textContent = value;
  });
  
  $('#weatherCard').classList.remove('hidden');
  $('#weatherOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeWeatherCard() {
  $('#weatherCard').classList.add('hidden');
  $('#weatherOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function getWindDirection(degree) {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return directions[Math.round(degree / 45) % 8];
}

function getUVLevel(uv) {
  if (uv <= 2) return '低';
  if (uv <= 5) return '中等';
  if (uv <= 7) return '高';
  if (uv <= 10) return '很高';
  return '极高';
}

function formatTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
}
