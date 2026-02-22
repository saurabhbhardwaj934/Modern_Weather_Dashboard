class WeatherDashboard {
    constructor() {
        this.apiKey = '95aabd896797f838855a0aa863d11e23'; // Get from OpenWeatherMap
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.geoUrl = 'https://api.openweathermap.org/geo/1.0';
        
        this.units = 'metric'; // 'metric' or 'imperial'
        this.currentCity = 'London';
        this.favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
        this.recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        this.theme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.updateTime();
        this.loadInitialData();
        this.loadRecentSearches();
        this.loadFavorites();
        
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => this.searchCity());
        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCity();
        });

        // Location buttons
        document.getElementById('currentLocation').addEventListener('click', () => {
            this.getCurrentLocation();
        });
        
        document.getElementById('detectLocation').addEventListener('click', () => {
            this.detectLocation();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Weather actions
        document.getElementById('refreshWeather').addEventListener('click', () => this.refreshWeather());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());

        // Hourly forecast controls
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const hours = parseInt(e.target.dataset.hours);
                this.loadHourlyForecast(hours);
            });
        });

        // Chart controls
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const chartType = e.target.dataset.chart;
                this.updateChart(chartType);
            });
        });

        // Units toggle
        document.getElementById('unitsToggle').addEventListener('click', () => this.toggleUnits());

        // Expand forecast
        document.getElementById('expandForecast').addEventListener('click', () => this.toggleForecastExpand());

        // Export data
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
    }

    async loadInitialData() {
        this.showLoading(true);
        try {
            await this.getWeatherData(this.currentCity);
            await this.getAirQuality();
            this.updateLastUpdated();
        } catch (error) {
            this.showToast('Failed to load weather data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async searchCity() {
        const cityInput = document.getElementById('cityInput');
        const city = cityInput.value.trim();
        
        if (!city) {
            this.showToast('Please enter a city name', 'error');
            return;
        }

        this.showLoading(true);
        try {
            await this.getWeatherData(city);
            this.addRecentSearch(city);
            cityInput.value = '';
        } catch (error) {
            this.showToast('City not found', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async getWeatherData(city) {
        try {
            // Get coordinates first
            const geoData = await this.fetchData(
                `${this.geoUrl}/direct?q=${city}&limit=1&appid=${this.apiKey}`
            );
            
            if (!geoData || geoData.length === 0) {
                throw new Error('City not found');
            }
            
            const { lat, lon, name, country } = geoData[0];
            
            // Get current weather
            const currentWeather = await this.fetchData(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=${this.units}&appid=${this.apiKey}`
            );
            
            // Get forecast
            const forecast = await this.fetchData(
                `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&units=${this.units}&appid=${this.apiKey}`
            );
            
            // Update UI with data
            this.updateCurrentWeather(currentWeather, name, country);
            this.updateForecast(forecast);
            this.updateWeatherStats(currentWeather);
            
            // Update current city
            this.currentCity = name;
            
            // Get air quality
            await this.getAirQuality(lat, lon);
            
            // Update favorites button
            this.updateFavoriteButton();
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            throw error;
        }
    }

    async getAirQuality(lat, lon) {
        try {
            // Note: Air quality API requires separate subscription
            // This is a placeholder - you'll need to implement based on your API plan
            const aqiData = {
                main: { aqi: 2 },
                components: {
                    pm2_5: 12.5,
                    pm10: 25,
                    o3: 60,
                    no2: 15
                }
            };
            
            this.updateAirQuality(aqiData);
        } catch (error) {
            console.log('Air quality data not available');
        }
    }

    updateCurrentWeather(data, city, country) {
        // Update city and date
        document.getElementById('currentCity').textContent = `${city}, ${country}`;
        document.getElementById('currentDate').textContent = this.formatDate(new Date());
        
        // Update temperature
        const temp = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const tempMax = Math.round(data.main.temp_max);
        const tempMin = Math.round(data.main.temp_min);
        
        document.getElementById('currentTemp').textContent = `${temp}°`;
        document.getElementById('feelsLike').textContent = `${feelsLike}°`;
        document.getElementById('highTemp').textContent = `${tempMax}°`;
        document.getElementById('lowTemp').textContent = `${tempMin}°`;
        
        // Update weather description and icon
        const weather = data.weather[0];
        document.getElementById('weatherDescription').textContent = weather.description;
        this.updateWeatherIcon(weather.icon, document.getElementById('weatherIcon'));
        
        // Update details
        document.getElementById('windDetail').textContent = `${data.wind.speed} ${this.units === 'metric' ? 'km/h' : 'mph'}`;
        document.getElementById('windDirection').textContent = this.getWindDirection(data.wind.deg);
        document.getElementById('humidityDetail').textContent = `${data.main.humidity}%`;
        document.getElementById('pressureDetail').textContent = `${data.main.pressure} hPa`;
        document.getElementById('visibilityDetail').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('cloudiness').textContent = `${data.clouds.all}%`;
        
        // Update sunrise/sunset
        if (data.sys) {
            document.getElementById('sunriseTime').textContent = this.formatTime(data.sys.sunrise * 1000);
            document.getElementById('sunsetTime').textContent = this.formatTime(data.sys.sunset * 1000);
            this.updateSunProgress(data.sys.sunrise, data.sys.sunset);
        }
    }

    updateForecast(data) {
        // Process daily forecast
        const dailyData = this.processDailyForecast(data.list);
        this.updateDailyForecast(dailyData);
        
        // Process hourly forecast
        const hourlyData = this.processHourlyForecast(data.list);
        this.updateHourlyForecast(hourlyData);
        
        // Update chart
        this.updateChart('temperature');
    }

    processDailyForecast(forecastList) {
        const dailyData = {};
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dailyData[day]) {
                dailyData[day] = {
                    temp_min: item.main.temp_min,
                    temp_max: item.main.temp_max,
                    weather: item.weather[0],
                    humidity: item.main.humidity,
                    wind_speed: item.wind.speed
                };
            } else {
                dailyData[day].temp_min = Math.min(dailyData[day].temp_min, item.main.temp_min);
                dailyData[day].temp_max = Math.max(dailyData[day].temp_max, item.main.temp_max);
            }
        });
        
        return dailyData;
    }

    processHourlyForecast(forecastList) {
        return forecastList.slice(0, 24).map(item => ({
            time: new Date(item.dt * 1000).getHours(),
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon,
            description: item.weather[0].description,
            pop: item.pop * 100, // Probability of precipitation
            humidity: item.main.humidity
        }));
    }

    updateDailyForecast(dailyData) {
        const forecastGrid = document.getElementById('dailyForecast');
        forecastGrid.innerHTML = '';
        
        Object.entries(dailyData).forEach(([day, data], index) => {
            if (index < 7) {
                const forecastDay = document.createElement('div');
                forecastDay.className = 'forecast-day';
                
                const tempRange = data.temp_max - data.temp_min;
                const currentTemp = (data.temp_min + data.temp_max) / 2;
                const fillPercentage = ((currentTemp - data.temp_min) / tempRange) * 100;
                
                forecastDay.innerHTML = `
                    <div class="day-name">${day}</div>
                    <div class="weather-range">
                        <i class="${this.getWeatherIconClass(data.weather.icon)}"></i>
                        <div class="temp-range-bar">
                            <div class="temp-fill" style="width: ${fillPercentage}%"></div>
                        </div>
                    </div>
                    <div class="day-temp">${Math.round(data.temp_min)}° / ${Math.round(data.temp_max)}°</div>
                `;
                
                forecastGrid.appendChild(forecastDay);
            }
        });
    }

    updateHourlyForecast(hourlyData) {
        const hourlySlider = document.getElementById('hourlyForecast');
        hourlySlider.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'hourly-container';
        
        hourlyData.forEach(hour => {
            const hourCard = document.createElement('div');
            hourCard.className = 'hour-card';
            
            hourCard.innerHTML = `
                <div class="hour-time">${hour.time}:00</div>
                <div class="hour-icon">
                    <i class="${this.getWeatherIconClass(hour.icon)}"></i>
                </div>
                <div class="hour-temp">${hour.temp}°</div>
                <div class="hour-description">${hour.description}</div>
                <div class="hour-pop">${Math.round(hour.pop)}%</div>
            `;
            
            container.appendChild(hourCard);
        });
        
        hourlySlider.appendChild(container);
    }

    updateWeatherStats(data) {
        document.getElementById('maxTemp').textContent = `${Math.round(data.main.temp_max)}°`;
        document.getElementById('minTemp').textContent = `${Math.round(data.main.temp_min)}°`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} ${this.units === 'metric' ? 'km/h' : 'mph'}`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    }

    updateAirQuality(data) {
        const aqi = data.main.aqi;
        const components = data.components;
        
        // Update AQI level
        document.getElementById('aqiLevel').innerHTML = `
            <span class="aqi-badge">${aqi}</span>
            <span class="aqi-text">${this.getAQIText(aqi)}</span>
        `;
        
        // Update pollutants
        document.getElementById('pm25').textContent = `${components.pm2_5} µg/m³`;
        document.getElementById('pm10').textContent = `${components.pm10} µg/m³`;
        document.getElementById('o3').textContent = `${components.o3} µg/m³`;
        document.getElementById('no2').textContent = `${components.no2} µg/m³`;
        
        // Update pointer position (0-500 scale)
        const pointer = document.getElementById('aqiPointer');
        const position = Math.min(Math.max(aqi / 500 * 100, 0), 100);
        pointer.style.left = `${position}%`;
    }

    updateChart(type) {
        const ctx = document.getElementById('weatherChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Sample data - in real app, use actual forecast data
        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
        let data, label, color;
        
        switch(type) {
            case 'temperature':
                data = Array.from({length: 24}, (_, i) => 15 + Math.sin(i / 3) * 5);
                label = 'Temperature (°C)';
                color = '#ef4444';
                break;
            case 'precipitation':
                data = Array.from({length: 24}, (_, i) => Math.random() * 100);
                label = 'Precipitation (%)';
                color = '#3b82f6';
                break;
            case 'wind':
                data = Array.from({length: 24}, (_, i) => 5 + Math.random() * 15);
                label = 'Wind Speed (km/h)';
                color = '#10b981';
                break;
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'var(--text-light)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'var(--text-light)'
                        }
                    }
                }
            }
        });
    }

    updateWeatherIcon(iconCode, element) {
        const iconClass = this.getWeatherIconClass(iconCode);
        element.innerHTML = `<i class="${iconClass}"></i>`;
    }

    getWeatherIconClass(iconCode) {
        const iconMap = {
            '01d': 'fas fa-sun',
            '01n': 'fas fa-moon',
            '02d': 'fas fa-cloud-sun',
            '02n': 'fas fa-cloud-moon',
            '03d': 'fas fa-cloud',
            '03n': 'fas fa-cloud',
            '04d': 'fas fa-cloud',
            '04n': 'fas fa-cloud',
            '09d': 'fas fa-cloud-rain',
            '09n': 'fas fa-cloud-rain',
            '10d': 'fas fa-cloud-showers-heavy',
            '10n': 'fas fa-cloud-showers-heavy',
            '11d': 'fas fa-bolt',
            '11n': 'fas fa-bolt',
            '13d': 'fas fa-snowflake',
            '13n': 'fas fa-snowflake',
            '50d': 'fas fa-smog',
            '50n': 'fas fa-smog'
        };
        
        return iconMap[iconCode] || 'fas fa-question';
    }

    getWindDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round((degrees % 360) / 45);
        return directions[index % 8];
    }

    getAQIText(aqi) {
        const levels = [
            'Good',
            'Fair',
            'Moderate',
            'Poor',
            'Very Poor'
        ];
        return levels[aqi - 1] || 'Unknown';
    }

    updateSunProgress(sunrise, sunset) {
        const now = Date.now() / 1000;
        const dayLength = sunset - sunrise;
        const sunProgress = ((now - sunrise) / dayLength) * 100;
        
        document.getElementById('sunProgress').style.width = `${Math.min(Math.max(sunProgress, 0), 100)}%`;
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastUpdated').textContent = `${this.formatDate(now)} at ${timeString}`;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation is not supported by your browser', 'error');
            return;
        }

        this.showLoading(true);
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `${this.geoUrl}/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${this.apiKey}`
                    );
                    const data = await response.json();
                    
                    if (data && data.length > 0) {
                        await this.getWeatherData(data[0].name);
                    }
                } catch (error) {
                    this.showToast('Failed to get location data', 'error');
                } finally {
                    this.showLoading(false);
                }
            },
            (error) => {
                this.showLoading(false);
                this.showToast('Unable to retrieve your location', 'error');
            }
        );
    }

    detectLocation() {
        // This would use IP-based location detection
        // For now, we'll use a default city
        this.getWeatherData('New York');
    }

    addRecentSearch(city) {
        if (!this.recentSearches.includes(city)) {
            this.recentSearches.unshift(city);
            if (this.recentSearches.length > 5) {
                this.recentSearches.pop();
            }
            localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
            this.loadRecentSearches();
        }
    }

    loadRecentSearches() {
        const container = document.getElementById('recentSearches');
        container.innerHTML = '';
        
        this.recentSearches.forEach(city => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.textContent = city;
            item.addEventListener('click', () => this.getWeatherData(city));
            container.appendChild(item);
        });
    }

    toggleFavorite() {
        if (this.favorites.includes(this.currentCity)) {
            this.favorites = this.favorites.filter(city => city !== this.currentCity);
            this.showToast('Removed from favorites', 'info');
        } else {
            this.favorites.push(this.currentCity);
            this.showToast('Added to favorites', 'success');
        }
        
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.loadFavorites();
        this.updateFavoriteButton();
    }

    loadFavorites() {
        const container = document.getElementById('favoritesList');
        container.innerHTML = '';
        
        this.favorites.forEach(city => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            
            item.innerHTML = `
                <span class="city-name">${city}</span>
                <span class="city-temp">--°</span>
            `;
            
            item.addEventListener('click', () => this.getWeatherData(city));
            container.appendChild(item);
        });
    }

    updateFavoriteButton() {
        const btn = document.getElementById('favoriteBtn');
        const icon = btn.querySelector('i');
        
        if (this.favorites.includes(this.currentCity)) {
            icon.className = 'fas fa-star';
            btn.title = 'Remove from favorites';
        } else {
            icon.className = 'far fa-star';
            btn.title = 'Add to favorites';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-mode', this.theme === 'dark');
        localStorage.setItem('theme', this.theme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    applyTheme() {
        document.body.classList.toggle('dark-mode', this.theme === 'dark');
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleUnits() {
        this.units = this.units === 'metric' ? 'imperial' : 'metric';
        this.showToast(`Switched to ${this.units === 'metric' ? 'Celsius' : 'Fahrenheit'}`, 'info');
        this.refreshWeather();
    }

    refreshWeather() {
        this.getWeatherData(this.currentCity);
    }

    toggleForecastExpand() {
        const forecastGrid = document.getElementById('dailyForecast');
        const btn = document.getElementById('expandForecast');
        
        forecastGrid.classList.toggle('expanded');
        btn.querySelector('i').classList.toggle('fa-chevron-down');
        btn.querySelector('i').classList.toggle('fa-chevron-up');
    }

    exportData() {
        // In a real app, this would export weather data as CSV/JSON
        this.showToast('Export feature coming soon!', 'info');
    }

    async fetchData(url) {
        this.showLoading(true);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.toggle('show', show);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const messageEl = toast.querySelector('.toast-message');
        const iconEl = toast.querySelector('.toast-icon');
        
        messageEl.textContent = message;
        toast.className = `toast ${type}`;
        
        // Set icon based on type
        iconEl.className = `toast-icon fas ${
            type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
            'fa-info-circle'
        }`;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const weatherDashboard = new WeatherDashboard();
    
    // Make available globally for debugging
    window.weatherDashboard = weatherDashboard;
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});