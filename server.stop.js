const io = require('socket.io-client');
const socketClient = io.connect('http://localhost:9999');

socketClient.on('connect', () => {
  socketClient.emit('apisimulatorstop');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
