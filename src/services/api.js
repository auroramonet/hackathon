// API service for backend communication

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Analyze a drawn catastrophe area using AI
 * @param {Object} data - Drawing data including coordinates, magnitude, center, placeName
 * @returns {Promise<Object>} - AI analysis response
 */
export const analyzeArea = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing area:", error);
    throw error;
  }
};

/**
 * Get disaster recommendations
 * @param {Object} data - Disaster type, magnitude, location
 * @returns {Promise<Object>} - Recommendations response
 */
export const getRecommendations = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting recommendations:", error);
    throw error;
  }
};

/**
 * Send a general AI query
 * @param {string} question - The question to ask
 * @returns {Promise<Object>} - AI answer response
 */
export const queryAI = async (question) => {
  try {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error querying AI:", error);
    throw error;
  }
};

/**
 * Check server health
 * @returns {Promise<Object>} - Health status
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error("Error checking server health:", error);
    throw error;
  }
};
