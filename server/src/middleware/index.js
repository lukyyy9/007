// Middleware index file
const auth = require('./auth');
const validation = require('./validation');

module.exports = {
  auth,
  validation
};