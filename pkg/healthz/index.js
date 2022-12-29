const http = require('http');
const { checkRedisClient } = require('./redis');

const initializeHealthz = () => {
  http.createServer(async (req, res) => {
    const url = req.url;
    if (url === '/redis') {
      const isHealthy = await checkRedisClient();
      const statusCode = (isHealthy) ? 200 : 503;

      res.writeHead(statusCode);
      res.end();
    }

    // Unknown route
    req.socket.end();
  }).listen(80, function () {
    console.log("Started HTTP server on port 80");
  });
}

module.exports = {
  initializeHealthz,
}