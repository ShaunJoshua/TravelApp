/**
 * Next.js configuration to expose server env variables
 */
module.exports = {
  env: {
    HF_API_KEY: process.env.HF_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    FOURSQUARE_API_KEY: process.env.FOURSQUARE_API_KEY,
  },
};
