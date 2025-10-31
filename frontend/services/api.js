// frontend/services/api.js
import axios from 'axios';

// ========================================
// CONFIGURATION
// ========================================
// For WEB: Use localhost
// For MOBILE: Use your computer's IP address
// 
// To find your IP:
// - Windows: Open CMD, run: ipconfig
// - Mac/Linux: Open Terminal, run: ifconfig
// - Look for IPv4 address (e.g., 192.168.1.100)
// ========================================

const API_BASE_URL = 'http://localhost:3001/api';

// For mobile testing, uncomment and update this:
// const API_BASE_URL = 'http://192.168.1.XXX:3001/api';

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Analyze product images using Google Vision AI
 * @param {Array} imageFiles - Array of image objects with uri, type, name
 * @returns {Promise} Response with extracted product data
 */
export const analyzeImages = async (imageFiles) => {
  try {
    const formData = new FormData();
    
    imageFiles.forEach((file, index) => {
      // For React Native
      formData.append('images', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `photo_${index}.jpg`,
      });
    });

    const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('analyzeImages error:', error);
    throw error;
  }
};

/**
 * Generate recipe suggestions from ingredients
 * @param {Array} ingredients - Array of ingredient names
 * @param {Array} customIngredients - Optional custom ingredient names
 * @returns {Promise} Response with recipe suggestions
 */
export const generateRecipes = async (ingredients, customIngredients = []) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/recipe/generate`, {
      ingredients,
      customIngredients
    }, {
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error('generateRecipes error:', error);
    throw error;
  }
};

/**
 * Get detailed recipe instructions
 * @param {string} recipeName - Name of the recipe
 * @param {Array} ingredients - Array of ingredient names
 * @returns {Promise} Response with detailed recipe
 */
export const getRecipeDetails = async (recipeName, ingredients) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/recipe/details`, {
      recipeName,
      ingredients
    }, {
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error('getRecipeDetails error:', error);
    throw error;
  }
};

/**
 * Get health rating analysis for product
 * @param {Array} ingredients - Array of ingredient names
 * @param {string} productName - Name of the product
 * @returns {Promise} Response with health rating analysis
 */
export const rateProduct = async (ingredients, productName = '') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rating/analyze`, {
      ingredients,
      productName
    }, {
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error('rateProduct error:', error);
    throw error;
  }
};

/**
 * Batch analyze multiple products
 * @param {Array} products - Array of product objects with ingredients
 * @returns {Promise} Response with batch analysis results
 */
export const batchRateProducts = async (products) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rating/batch`, {
      products
    }, {
      timeout: 60000, // Longer timeout for batch processing
    });

    return response.data;
  } catch (error) {
    console.error('batchRateProducts error:', error);
    throw error;
  }
};

/**
 * Check backend server health
 * @returns {Promise} Response with server status
 */
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    console.error('checkBackendHealth error:', error);
    throw error;
  }
};

// Export base URL for debugging
export const getBaseURL = () => API_BASE_URL;