import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { SpeedInsights } from "@vercel/speed-insights/react"

function App() {
  const [data, setData] = useState({});
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState('');
  const [savedCities, setSavedCities] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  
  const API_KEY = '27bad8363ddda38a5d52da4072d2adc1';

  // Load saved cities and last selected city on mount
  useEffect(() => {
    const savedCitiesList = JSON.parse(localStorage.getItem('savedCities')) || [];
    setSavedCities(savedCitiesList);
    
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
      fetchWeatherData(lastCity);
    }
    
    // Set default background image
    setBackgroundImage('https://source.unsplash.com/1600x900/?nature,sky');
  }, []);

  // Function to fetch current weather data
  const fetchWeatherData = (city) => {
    setIsLoading(true);
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
    
    axios.get(currentWeatherUrl)
      .then((response) => {
        setData(response.data);
        setErrorMessage('');
        localStorage.setItem('lastCity', city);
        
        // Change background based on weather condition
        const condition = response.data.weather[0].main.toLowerCase();
        setBackgroundImage(`https://source.unsplash.com/1600x900/?${condition},weather`);
        
        // Fetch forecast data
        fetchForecastData(city);
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Weather API error:", error);
        if (error.response && error.response.status === 404) {
          setErrorMessage("City not found. It may be a small village or misspelled.");
        } else {
          setErrorMessage("Something went wrong. Please try again later.");
        }
        setData({});
        setForecast([]);
      });
  };

  // Function to fetch 5-day forecast
  const fetchForecastData = (city) => {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
    
    axios.get(forecastUrl)
      .then((response) => {
        // Process forecast data to get one forecast per day
        const forecastData = response.data.list;
        const dailyForecasts = [];
        const dates = {};
        
        forecastData.forEach(item => {
          const date = item.dt_txt.split(' ')[0];
          if (!dates[date] && Object.keys(dates).length < 5) {
            dates[date] = true;
            dailyForecasts.push(item);
          }
        });
        
        setForecast(dailyForecasts);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Forecast API error:", error);
        setForecast([]);
        setIsLoading(false);
      });
  };

  // Handle search
  const searchLocation = (event) => {
    if (event.key === "Enter" && location.trim() !== '') {
      fetchWeatherData(location);
      setLocation('');
    }
  };

  // Save city to favorites
  const saveCity = () => {
    if (data.name && !savedCities.includes(data.name)) {
      const updatedCities = [...savedCities, data.name];
      setSavedCities(updatedCities);
      localStorage.setItem('savedCities', JSON.stringify(updatedCities));
    }
  };

  // Remove city from favorites
  const removeCity = (city) => {
    const updatedCities = savedCities.filter(c => c !== city);
    setSavedCities(updatedCities);
    localStorage.setItem('savedCities', JSON.stringify(updatedCities));
  };

  // Format date from timestamp
  const formatDate = (dt_txt) => {
    const date = new Date(dt_txt);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="app" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="overlay">
        <div className="content">
          <div className="search-container">
            <input
              value={location}
              onChange={event => setLocation(event.target.value)}
              onKeyPress={searchLocation}
              placeholder='Enter Location'
              type="text"
              className="search-input"
            />
          </div>

          {isLoading ? (
            <div className="card loading-card">
              <div className="loader"></div>
              <p>Loading weather data...</p>
            </div>
          ) : errorMessage ? (
            <div className="card error-card">
              <p className="error-message">{errorMessage}</p>
            </div>
          ) : null}

          {/* Current Weather Display */}
          {data.name && !isLoading && (
            <div className="card weather-card">
              <div className="weather-header">
                <div className="location-info">
                  <h2>{data.name}, {data.sys?.country}</h2>
                  <p className="date-info">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <button 
                  className="save-button"
                  onClick={saveCity}
                  disabled={savedCities.includes(data.name)}
                >
                  {savedCities.includes(data.name) ? '★ Saved' : '☆ Save City'}
                </button>
              </div>
              
              <div className="weather-body">
                <div className="temperature-container">
                  {data.main && <h1 className="temperature">{data.main.temp.toFixed()}°C</h1>}
                  {data.weather && (
                    <div className="weather-description">
                      <p>{data.weather[0].description}</p>
                      <img 
                        src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`} 
                        alt={data.weather[0].description}
                        className="weather-icon"
                      />
                    </div>
                  )}
                </div>

                <div className="weather-details">
                  <div className="detail-item">
                    <span className="detail-label">Feels Like</span>
                    {data.main && <span className="detail-value">{data.main.feels_like.toFixed()}°C</span>}
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Humidity</span>
                    {data.main && <span className="detail-value">{data.main.humidity}%</span>}
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Wind Speed</span>
                    {data.wind && <span className="detail-value">{data.wind.speed.toFixed()} MPH</span>}
                  </div>
                  {data.main && (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Min Temp</span>
                        <span className="detail-value">{data.main.temp_min.toFixed()}°C</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Temp</span>
                        <span className="detail-value">{data.main.temp_max.toFixed()}°C</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5-Day Forecast */}
          {forecast.length > 0 && !isLoading && (
            <div className="card forecast-card">
              <h2 className="section-title">5-Day Forecast</h2>
              <div className="forecast-container">
                {forecast.map((day, index) => (
                  <div key={index} className="forecast-day">
                    <h3 className="forecast-date">{formatDate(day.dt_txt)}</h3>
                    <img 
                      src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                      alt={day.weather[0].description}
                      className="forecast-icon"
                    />
                    <p className="forecast-temp">{day.main.temp.toFixed()}°C</p>
                    <p className="forecast-desc">{day.weather[0].description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Cities */}
          {savedCities.length > 0 && (
            <div className="card saved-cities-card">
              <h2 className="section-title">Saved Cities</h2>
              <div className="saved-cities-list">
                {savedCities.map((city, index) => (
                  <div key={index} className="saved-city-item">
                    <button 
                      className="city-button"
                      onClick={() => fetchWeatherData(city)}
                    >
                      {city}
                    </button>
                    <button 
                      className="remove-button"
                      onClick={() => removeCity(city)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;