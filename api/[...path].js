const app = require("../backend/app");
const serverless = require("serverless-http");

const handler = serverless(app);

module.exports = async (req, res) => {
  // Strip /api prefix so Express routes match (e.g., /api/auth/token -> /auth/token)
  req.url = req.url.replace(/^\/api/, "") || "/";
  return handler(req, res);
};
