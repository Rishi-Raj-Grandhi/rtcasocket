const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const port = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};

app.use(express.static(path.resolve('./public')));

app.get('/', (req, res) => {
  return res.sendFile('/public/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('set nickname', (nickname) => {
    users[socket.id] = nickname;
    io.emit('user connected', nickname);
    io.emit('update users', Object.values(users));
  });

  socket.on('disconnect', () => {
    const nickname = users[socket.id];
    delete users[socket.id];
    io.emit('user disconnected', nickname);
    io.emit('update users', Object.values(users));
  });

  socket.on('user-message', (message) => {
    const nickname = users[socket.id];
    socket.broadcast.emit('message', { nickname, message });
  });

  socket.on('typing', (isTyping) => {
    const nickname = users[socket.id];
    socket.broadcast.emit('typing', { nickname, isTyping });
  });

  socket.on('private message', ({ toNickname, message }) => {
    const fromNickname = users[socket.id];
    const toSocketId = Object.keys(users).find(key => users[key] === toNickname);
    if (toSocketId) {
      io.to(toSocketId).emit('private message', { fromNickname, message });
    }
  });
});

server.listen(port, (req, res) => {
  console.log(`The server is up and running on port ${port}`);
});
