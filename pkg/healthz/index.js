const http = require('http');
const { checkRedisClient } = require('./redis');

const initializeHealthz = () => {
  http.createServer(async (req, res) => {
    const url = req.url;
    console.log("Received HTTP request on", url);
    if (url === '/redis') {
      const isHealthy = await checkRedisClient();
      const statusCode = (isHealthy) ? 200 : 503;

      res.writeHead(statusCode);
      res.end();
    }

    // Unknown route
    req.socket.end();
  }).listen(8080, function () {
    console.log("Started HTTP server on port 8080");
  });
}

module.exports = {
  initializeHealthz,
}