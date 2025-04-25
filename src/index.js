const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');  // Adjust the path if needed

dotenv.config();  // Load environment variables

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(express.json());  // to parse JSON bodies
app.use(cors({ 
  origin: "https://chat-buddy-rosy.vercel.app/" || 'http://localhost:3000',  // Allow frontend from this URL
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Sample route to test API
app.get('/', (req, res) => {
  res.send('API Running');
});

// Your API routes (if any)
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Setup server and Socket.IO
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

const io = socketIo(server, {
  pingTimeout: 60000,  // Optional config to manage timeouts
  cors: {
    origin: "https://chat-buddy-rosy.vercel.app/" || 'http://localhost:3000', // Match with your frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected: ', socket.id);

  socket.on('setup', (userData) => {
    socket.join(userData._id); // Room for user
    socket.emit('connected');
  });

  // Handling joining a chat
  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('User joined room: ' + room);
  });

  // Typing event
  socket.on('typing', (room) => {
    socket.to(room).emit('typing');
  });

  socket.on('stop typing', (room) => {
    socket.to(room).emit('stop typing');
  });

  // New message event
  socket.on('new message', (newMessageRecieved) => {
    const chat = newMessageRecieved.chat;
    if (!chat.users) return console.log('Chat users not defined');
    
    // Send the new message to all other users in the chat
    chat.users.forEach((user) => {
      if (user._id !== newMessageRecieved.sender._id) {
        socket.to(user._id).emit('message recieved', newMessageRecieved);
      }
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected: ', socket.id);
  });
});
