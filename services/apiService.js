// services/apiService.js - Using CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const dotenv = require('dotenv');

dotenv.config();

// Helper function for retries
const fetchWithRetry = async (url, options = {}, maxRetries = 2, retryDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add timeout with AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // For 404 errors, don't retry - the resource doesn't exist
      if (response.status === 404) {
        throw new Error(`Resource not found: ${url}`);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt + 1} failed for ${url}: ${error.message}`);
      
      // Don't retry 404 errors
      if (error.message.includes('404') || error.message.includes('not found')) {
        break;
      }
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError;
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
      console.warn('Weather API key not found in environment variables');
      return null;
    }
    
    console.log(`Fetching weather data for location: ${location}`);
    
    // Make API request with error handling
    try {
      const data = await fetchWithRetry(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`,
        { timeout: 8000 }
      );
      
      console.log(`Successfully received weather data for ${location}`);
      
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
    } catch (fetchError) {
      console.error(`Failed to fetch weather data: ${fetchError.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error in getWeather function:', error.message);
    // Return null instead of throwing to avoid breaking the app
    return null;
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
      console.warn('Weather API key not found in environment variables');
      return null;
    }
    
    console.log(`Fetching forecast data for location: ${location}`);
    
    // Make API request with error handling
    try {
      const data = await fetchWithRetry(
        `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=7`,
        { timeout: 8000 }
      );
      
      console.log(`Successfully received forecast data for ${location}`);
      return data;
    } catch (fetchError) {
      console.error(`Failed to fetch forecast data: ${fetchError.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error in getForecast function:', error.message);
    return null;
  }
};

// Metropolitan Museum of Art API service for recommendations
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
    
    console.log(`Finding artworks related to: ${mood} based on weather condition: ${weatherCondition}`);
    
    // Use the Metropolitan Museum API to get recommendations
    try {
      // Get a list of object IDs from the search endpoint
      const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(mood)}&hasImages=true`;
      console.log(`Searching Met Museum API: ${searchUrl}`);
      
      const searchData = await fetchWithRetry(searchUrl, { timeout: 8000 });
      
      if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
        console.log('No artworks found matching the mood');
        return [];
      }
      
      console.log(`Found ${searchData.objectIDs.length} potential artworks`);
      
      // Get only the first 20 IDs (or fewer if there are fewer)
      // This reduces the chance of hitting non-existent objects
      const limitedIds = searchData.objectIDs.slice(0, 20);
      
      // First check which objects exist by using the objects endpoint
      const objectsEndpoint = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';
      console.log(`Checking which objects exist at ${objectsEndpoint}`);
      
      // Take a random sample of IDs
      const sampleSize = Math.min(5, limitedIds.length);
      const selectedIds = [];
      const allIds = [...limitedIds];
      
      // Shuffle the array to get random IDs
      for (let i = allIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
      }
      
      // Take the first few IDs from the shuffled array
      const idsToFetch = allIds.slice(0, sampleSize);
      console.log(`Selected ${idsToFetch.length} random artwork IDs for details: ${idsToFetch.join(', ')}`);
      
      // Fetch details for each object (with fallbacks for errors)
      const artworks = [];
      
      for (const id of idsToFetch) {
        try {
          const objectUrl = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
          console.log(`Fetching details for object ID ${id} from ${objectUrl}`);
          
          const artwork = await fetchWithRetry(
            objectUrl,
            { timeout: 5000 },
            1  // Only try once - no retries for individual objects
          );
          
          if (artwork && artwork.objectID) {
            artworks.push({
              id: artwork.objectID,
              title: artwork.title || 'Untitled',
              artist_display: artwork.artistDisplayName || 'Unknown Artist',
              image_id: artwork.primaryImageSmall || ''
            });
            console.log(`Successfully fetched details for artwork ${id}: ${artwork.title}`);
          }
        } catch (objectError) {
          console.warn(`Failed to fetch details for artwork ${id}: ${objectError.message}`);
          // Continue with next artwork
        }
      }
      
      console.log(`Successfully fetched details for ${artworks.length} artworks`);
      return artworks;
    } catch (searchError) {
      console.error('Error searching for artworks:', searchError.message);
      return [];
    }
  } catch (error) {
    console.error('Error getting art recommendations:', error.message);
    // Return empty array instead of throwing to avoid breaking the app
    return [];
  }
};

// Export all functions 
module.exports = {
  getWeather,
  getForecast,
  getArtRecommendations
};