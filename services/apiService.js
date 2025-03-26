// services/apiService.js
const fetch = require('node-fetch');

// Art Institute of Chicago API integration
// Documentation: https://api.artic.edu/docs/

/**
 * Fetches artwork data from the Art Institute of Chicago API
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
exports.getArtworks = async (params = {}) => {
  try {
    // Default parameters
    const defaultParams = {
      limit: 10,
      fields: 'id,title,artist_display,date_display,main_reference_number,image_id',
      page: 1
    };

    // Merge default params with provided params
    const queryParams = { ...defaultParams, ...params };
    
    // Build query string
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    // Make API request
    const response = await fetch(
      `https://api.artic.edu/api/v1/artworks?${queryString}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
exports.getArtworkById = async (id) => {
  try {
    const response = await fetch(
      `https://api.artic.edu/api/v1/artworks/${id}?fields=id,title,artist_display,date_display,main_reference_number,image_id,medium_display,dimensions,description,provenance_text,publication_history,exhibition_history`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
exports.searchArtworks = async (query, params = {}) => {
  try {
    // Default parameters
    const defaultParams = {
      limit: 20,
      fields: 'id,title,artist_display,date_display,main_reference_number,image_id',
      page: 1
    };

    // Merge default params with provided params
    const queryParams = { 
      ...defaultParams, 
      ...params,
      q: query 
    };
    
    // Build query string
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    // Make API request
    const response = await fetch(
      `https://api.artic.edu/api/v1/artworks/search?${queryString}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching artworks:', error);
    throw error;
  }
};

// Weather API
/**
 * Fetches weather data from OpenWeatherMap API
 * @param {String} location - City name or location
 * @returns {Promise<Object>} Weather data
 */
exports.getWeather = async (location = 'New York') => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('Weather API key not found in environment variables');
    }
    
    // Make API request
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
exports.getForecast = async (location = 'New York') => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('Weather API key not found in environment variables');
    }
    
    // Make API request
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
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
exports.getArtRecommendations = async (weatherCondition) => {
  try {
    // Map weather conditions to art moods/themes
    const moodMap = {
      'Clear': 'landscape,sunny',
      'Clouds': 'abstract,cloudy',
      'Rain': 'impressionist,rainy',
      'Snow': 'winter,snow',
      'Thunderstorm': 'dramatic,storm',
      'Drizzle': 'watercolor,misty',
      'Mist': 'foggy,atmospheric',
      'default': 'colorful,popular'
    };
    
    // Get appropriate mood for the weather
    const mood = moodMap[weatherCondition] || moodMap.default;
    
    // Use the Art Institute API to get recommendations
    const response = await this.searchArtworks(mood, { limit: 5 });
    
    return response.data || [];
  } catch (error) {
    console.error('Error getting art recommendations:', error);
    // Return empty array instead of throwing to avoid breaking the app
    return [];
  }
};