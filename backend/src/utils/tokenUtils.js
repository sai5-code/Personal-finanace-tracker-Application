const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {string} userId - User ID
 * @param {string} expiresIn - Token expiration time
 * @returns {string} - JWT token
 */
exports.generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode JWT Token without verification
 * @param {string} token - JWT token
 * @returns {object} - Decoded token
 */
exports.decodeToken = (token) => {
  return jwt.decode(token);
};