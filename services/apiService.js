// services/apiService.js - Using CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const dotenv = require('dotenv');

dotenv.config();

// Metropolitan Museum of Art API integration
// Documentation: https://metmuseum.github.io/

/**
 * Fetches artwork data from the Metropolitan Museum API
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
const getArtworks = async (params = {}) => {
  try {
    // Default parameters
    const defaultParams = {
      limit: 10,
      page: 1
    };

// Export all functions 
module.exports = {
  getArtworks,
  getArtworkById,
  searchArtworks,
  getWeather,
  getForecast,
  getArtRecommendations
};

    // Merge default params with provided params
    const queryParams = { ...defaultParams, ...params };
    
    // Metropolitan Museum API doesn't have pagination in the same way
    // We'll need to fetch IDs first, then get objects
    
    // First, search for object IDs
    let response = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/search?q=hasImages=true');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const searchData = await response.json();
    
    // Take a subset of IDs based on our pagination parameters
    const startIndex = (queryParams.page - 1) * queryParams.limit;
    const selectedIds = searchData.objectIDs.slice(startIndex, startIndex + queryParams.limit);
    
    // Fetch details for each object
    const artworkPromises = selectedIds.map(id => 
      fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)
        .then(res => res.json())
    );
    
    const artworks = await Promise.all(artworkPromises);
    
    return {
      data: artworks,
      pagination: {
        total: searchData.total,
        count: artworks.length,
        pages: Math.ceil(searchData.total / queryParams.limit)
      }
    };
  } catch (error) {
    console.error('Error fetching artworks:', error);
    throw error;
  }
};

/**
 * Gets details for a specific artwork by ID
 * @param {String} id - Artwork ID
 * @returns {Promise<Object>} Artwork details
 */
const getArtworkById = async (id) => {
  try {
    const response = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error(`Error fetching artwork ${id}:`, error);
    throw error;
  }
};

/**
 * Search artworks by term
 * @param {String} query - Search term
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} Search results
 */
const searchArtworks = async (query, params = {}) => {
  try {
    // Default parameters
    const defaultParams = {
      limit: 20,
      page: 1
    };

    // Merge default params with provided params
    const queryParams = { 
      ...defaultParams, 
      ...params
    };
    
    // Search for objects matching the query
    const response = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const searchData = await response.json();
    
    if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
      return { data: [], pagination: { total: 0, count: 0, pages: 0 } };
    }
    
    // Take a subset of IDs based on our pagination parameters
    const startIndex = (queryParams.page - 1) * queryParams.limit;
    const selectedIds = searchData.objectIDs.slice(startIndex, startIndex + queryParams.limit);
    
    // Fetch details for each object
    const artworkPromises = selectedIds.map(id => 
      fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)
        .then(res => res.json())
    );
    
    const artworks = await Promise.all(artworkPromises);
    
    return {
      data: artworks,
      pagination: {
        total: searchData.objectIDs.length,
        count: artworks.length,
        pages: Math.ceil(searchData.objectIDs.length / queryParams.limit)
      }
    };
  } catch (error) {
    console.error('Error searching artworks:', error);
    throw error;
  }
};

// Weather API integration with WeatherAPI.com
/**
 * Fetches weather data from WeatherAPI.com
 * @param {String} location - City name or location
 * @returns {Promise<Object>} Weather data
 */
const getWeather = async (location = 'New York') => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('Weather API key not found in environment variables');
    }
    
    // Make API request
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the response to match the format expected by our application
    return {
      name: data.location.name,
      main: {
        temp: data.current.temp_c
      },
      weather: [
        {
          main: data.current.condition.text,
          description: data.current.condition.text,
          icon: data.current.condition.icon
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

/**
 * Gets forecast data for a location
 * @param {String} location - City name or location
 * @returns {Promise<Object>} Forecast data
 */
const getForecast = async (location = 'New York') => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('Weather API key not found in environment variables');
    }
    
    // Make API request
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=7`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
};

// External Art API service for recommendations
/**
 * Fetches art recommendations based on weather conditions
 * @param {String} weatherCondition - Current weather condition
 * @returns {Promise<Array>} List of recommended artworks
 */
const getArtRecommendations = async (weatherCondition) => {
  try {
    // Map weather conditions to art moods/themes
    const moodMap = {
      'Clear': 'sunlight,sky',
      'Sunny': 'sunlight,sky',
      'Partly cloudy': 'landscape,sky',
      'Cloudy': 'clouds,grey',
      'Overcast': 'clouds,grey',
      'Mist': 'fog,mist',
      'Fog': 'fog,mist',
      'Rain': 'rain,water',
      'Snow': 'snow,winter',
      'Sleet': 'snow,winter',
      'Thunderstorm': 'storm,dramatic',
      'default': 'colorful,popular'
    };
    
    // Get appropriate mood for the weather
    const mood = moodMap[weatherCondition] || moodMap.default;
    
    // Use the Metropolitan Museum API to get recommendations
    const response = await searchArtworks(mood, { limit: 5 });
    
    // Transform the data to match the format expected by our application
    const transformedData = response.data.map(item => ({
      id: item.objectID,
      title: item.title,
      artist_display: item.artistDisplayName,
      image_id: item.primaryImageSmall
    }));
    
    return transformedData;
  } catch (error) {
    console.error('Error getting art recommendations:', error);
    // Return empty array instead of throwing to avoid breaking the app
    return [];
  }
};