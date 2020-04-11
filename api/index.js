const server = require("http").createServer();
const { exec } = require("child_process");

const pingTo = (ip, eventName) => {
  const emitter = setInterval(() => {
    const ping = exec(
      `ping ${ip} -c 1 | grep -Eo 'time=([0-9.]+)'`,
      function (error, stdout, stderr) {
        if (error) {
          console.log("Error code: " + error.code);
          console.log("Signal received: " + error.signal);
        }
        io.emit(eventName, stdout.split("=")[1]);
      }
    );

    ping.on("exit", function (code) {
      if (code) {
        console.log("no " + eventName);
        io.emit("no-" + eventName);
      }
    });
  }, 500);
  return emitter;
};

const io = require("socket.io")(server, {
  serveClient: false,
  // below are engine.IO options
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});

server.listen(3006, (err) => {
  pingTo('192.168.1.1', 'ping')
  pingTo('200.40.161.197', 'gate')
  pingTo('8.8.8.8', 'dns')
  pingTo('1.1.1.1', 'cloud')
  if (err) {
    console.log("Could not listen on 3006");
    return;
  }
  console.log(":: Listening on :3006");
});
