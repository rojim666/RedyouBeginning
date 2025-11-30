
import { $, showToast } from './utils.js';
import { fetchWeather, fetchLocationName } from './api.js';

let weatherData = null;

export function initWeather() {
  const weatherEl = $('#weather');
  if (!weatherEl) return;
  
  // Bind click event to show detailed card
  weatherEl.addEventListener('click', showWeatherCard);
  
  // Bind close button for weather card
  const closeBtn = $('#closeWeatherCard');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeWeatherCard);
  }
  
  // Bind overlay click
  const overlay = $('#weatherOverlay');
  if (overlay) {
    overlay.addEventListener('click', closeWeatherCard);
  }
  
  const savedWeather = localStorage.getItem('startpage.weather');
  if (savedWeather) {
    try {
      const data = JSON.parse(savedWeather);
      // Cache for 1 hour
      if (Date.now() - data.timestamp < 60 * 60 * 1000) { 
        weatherData = data;
        renderWeatherWidget();
        return;
      }
    } catch (e) {
      console.error('Error parsing saved weather:', e);
    }
  }
  
  getWeather();
  
  // Update every 30 minutes
  setInterval(getWeather, 30 * 60 * 1000);
}

async function getLocationName(latitude, longitude) {
  try {
    const data = await fetchLocationName(latitude, longitude);
    const address = data.address;
    
    return address.city || 
           address.county || 
           address.state || 
           address.province || 
           address.country || 
           '未知位置';
  } catch (error) {
    console.warn('获取位置名称失败:', error);
  }
  
  return '当前位置';
}

function getWeather() {
  if (!navigator.geolocation) {
    renderWeatherError('不支持定位');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        
        // Get location name
        const locationName = await getLocationName(latitude, longitude);
        
        // Get weather data
        const data = await fetchWeather(latitude, longitude);
        const current = data.current;
        const daily = data.daily;
        
        const weatherCode = current.weather_code;
        
        // Process data
        weatherData = {
          location: locationName,
          temp: Math.round(current.temperature_2m),
          code: weatherCode,
          icon: getWeatherIcon(weatherCode),
          description: getWeatherDesc(weatherCode),
          humidity: current.relative_humidity_2m,
          feelsLike: Math.round(current.apparent_temperature),
          windSpeed: Math.round(current.wind_speed_10m),
          windDirection: getWindDirection(current.wind_direction_10m),
          uvIndex: daily.uv_index_max[0],
          uvLevel: getUVLevel(daily.uv_index_max[0]),
          sunrise: formatTime(daily.sunrise[0]),
          sunset: formatTime(daily.sunset[0]),
          visibility: 10, // Default
          updateTime: new Date().toLocaleString('zh-CN', { 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timestamp: Date.now()
        };
        
        localStorage.setItem('startpage.weather', JSON.stringify(weatherData));
        
        renderWeatherWidget();
      } catch (error) {
        console.error('Weather error:', error);
        renderWeatherError('获取失败');
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      renderWeatherError('定位失败');
    }
  );
}

function renderWeatherWidget() {
  if (!weatherData) return;
  
  const iconEl = $('#weatherIcon');
  const tempEl = $('#weatherTemp');
  
  if (iconEl) iconEl.textContent = weatherData.icon;
  if (tempEl) tempEl.textContent = `${weatherData.temp}°C`;
}

function renderWeatherError(msg) {
  const tempEl = $('#weatherTemp');
  if (tempEl) tempEl.textContent = msg;
}

function showWeatherCard() {
  if (!weatherData) {
    showToast('天气数据加载中，请稍候...');
    getWeather();
    return;
  }
  
  // Update card content
  $('#weatherLocation').textContent = weatherData.location || '天气详情';
  $('#weatherCardIcon').textContent = weatherData.icon;
  $('#weatherCardTemp').textContent = `${weatherData.temp}°C`;
  $('#weatherCardDesc').textContent = weatherData.description;
  $('#weatherWindSpeed').textContent = `${weatherData.windSpeed} km/h`;
  $('#weatherHumidity').textContent = `${weatherData.humidity}%`;
  $('#weatherFeelsLike').textContent = `${weatherData.feelsLike}°C`;
  $('#weatherVisibility').textContent = `${weatherData.visibility} km`;
  $('#weatherUV').textContent = `${weatherData.uvIndex} (${weatherData.uvLevel})`;
  $('#weatherSunrise').textContent = weatherData.sunrise;
  $('#weatherSunset').textContent = weatherData.sunset;
  $('#weatherWindDir').textContent = weatherData.windDirection;
  $('#weatherUpdateTime').textContent = `更新时间：${weatherData.updateTime}`;
  
  // Show card
  $('#weatherCard').classList.remove('hidden');
  $('#weatherOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeWeatherCard() {
  $('#weatherCard').classList.add('hidden');
  $('#weatherOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if (code === 1) return '🌤️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌧️';
  if (code <= 65) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '⛈️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function getWeatherDesc(code) {
  const map = {
    0: '晴朗', 1: '晴朗', 2: '多云', 3: '阴天',
    45: '有雾', 48: '有雾', 51: '小雨', 53: '中雨', 55: '大雨',
    61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
    77: '雨夹雪', 80: '阵雨', 81: '雷阵雨', 82: '强雷阵雨',
    85: '阵雪', 86: '大阵雪', 95: '雷暴', 96: '冰雹', 99: '强冰雹'
  };
  return map[code] || '未知';
}

function getWindDirection(degree) {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const index = Math.round(degree / 45) % 8;
  return directions[index];
}

function getUVLevel(uvIndex) {
  if (uvIndex <= 2) return '低';
  if (uvIndex <= 5) return '中等';
  if (uvIndex <= 7) return '高';
  if (uvIndex <= 10) return '很高';
  return '极高';
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
