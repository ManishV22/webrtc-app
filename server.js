const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = {}; // { number: socket.id }

function generateRandomNumber() {
  return '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

io.on('connection', socket => {
  const number = generateRandomNumber();
  users[number] = socket.id;

  socket.emit('your-number', number);
  console.log(`User connected: ${number}`);

  socket.on('call-user', ({ to, from, offer }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit('incoming-call', { from, offer });
    } else {
      socket.emit('user-not-found');
    }
  });

  socket.on('answer-call', ({ to, answer }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit('call-answered', { answer });
    }
  });

  socket.on('disconnect', () => {
    for (let number in users) {
      if (users[number] === socket.id) {
        delete users[number];
        console.log(`User disconnected: ${number}`);
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
