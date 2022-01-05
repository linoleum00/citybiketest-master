const express = require("express");
const http = require("http");
const axios = require("axios");
const socketIo = require("socket.io");
const citybikeurl = "http://api.citybik.es/v2/networks/decobike-miami-beach"



const port = process.env.PORT || 4001;
const index = require("./routes/index");
const app = express();


app.use(index);

const server = http.createServer(app);
const io = socketIo(server); // < Interesting!
let interval = 10000;

io.on("connection", socket => {
  var socketId = socket.id;
  var clientIp = socket.request.connection.remoteAddress;
  console.log('New connection ' + socketId + ' from ' + clientIp);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  socket.on("startListening", () => {
    (function getBikesStations() {
      axios.get(citybikeurl).then(response => {
        const stations = response?.data?.network?.stations;
        socket.emit('gotBikesStations', stations.map(x => ({
          id: x.id,
          emptySlots: x.empty_slots,
          freeBikes: x.free_bikes,
          latitude: x.latitude,
          longitude: x.longitude,
          name: x.name,
        })))
      }).catch(e => console.log('----------------got Error----------------', e));
      setTimeout(getBikesStations, interval);
    })();
  })
});



server.listen(port, () => console.log(`Listening on port ${port}`));



