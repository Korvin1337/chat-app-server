require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// "Cross-Origin Resource Sharing is an HTTP-header based mechanism that allows a server to indicate any origins(domain, scheme or port)
// ..Other than its own from which a browser should permit loading resources." - https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
app.use(cors());

const saveMessage = require("./services/save-message"); // save the messages from harperDb
const getMessages = require("./services/get-messages");  // get the messages from harperDb
const getPrivateMessages = require('./services/get-private-messages') // get the private mesages from harperDb 
const savePrivateMessage = require('./services/save-private-message') // get the private mesages from harperDb 

// Creates a server on the computer
const server = http.createServer(app);

// Creates io server using CORS from origin with post and get methods
const io = new Server(server, {
  cors: {
    methods: ["GET", "POST"],
    origin: "http://localhost:3000",
  },
});

const leaveRoom = require("./utils/leave-room"); // handle user leaving room
const leaveServer = require("./utils/leave-server"); // removes user from serverlisting array.

// Bot for sending messages in the rooms for events triggering such as join and leave etc.
const CHAT_BOT = "ChatBot";

let chatRoom = ""; // Any of our rooms like potato, sandwich, football etc.
let allUsers = []; // Lists for the current users in the room


// Socket.io-client listens for client connections
io.on("connection", (socket) => {
  console.log(`A User Has Connected: ${socket.id}`);

  socket.on("join_server", (data) => {
    const username = data;
    allUsers.push({ id: socket.id, username });
    socket.emit("all_users", allUsers);
  });

  // Saves all users connected, for listing purposes.

  // Socket adds user to fitting room
  socket.on("join_room", (data) => {
    const { username, room } = data; // The data that`s sent from the client during join_room event being emitted
    socket.join(room); // User joins socket room

    let __createdtime__ = Date.now(); // Snapshot the current timestamp

    socket.to(room).emit("receive_message", {
      message: `${username} joined the room`,
      username: CHAT_BOT,
      __createdtime__,
    });

    socket.emit("receive_message", {
      message: `I bid you welcome ${username}`,
      username: CHAT_BOT,
      __createdtime__,
    });

    // Saves a new user to correlating room
    chatRoom = room;
    allUsers.push({ id: socket.id, username, room });
    chatRoomUsers = allUsers.filter((user) => user.room === room);
    socket.to(room).emit("chatroom_users", chatRoomUsers);
    socket.emit("chatroom_users", chatRoomUsers);

    getMessages(room)
      .then((last20Messages) => {
        socket.emit("last_20_messages", last20Messages);
      })
      .catch((err) => console.log(err));
  });

  socket.on("join_private", (data) => {
    const { targetUser, currentUser } = data

    /*socket.join(room)*/
    let __createdtime__ = Date.now();

    /*socket.to(room).emit("receive_private_messages", {
      message: `${username} joined the private chat`,
      username: CHAT_BOT,
      __createdtime__,
    });*/

    socket.emit("receive_private_messages", {
      message: `I bid you welcome ${currentUser}`,
      username: CHAT_BOT,
      __createdtime__,
    });

    getPrivateMessages(data.user.id, data.targetUser.id)
      .then((last20PrivateMessages) => {
        socket.emit("last_20_private_messages", last20PrivateMessages)
      })
      .catch((err) => console.log(err.data))
  })

  socket.on("leave_room", (data) => {
    const { username, room } = data;
    socket.leave(room);
    const __createdtime__ = Date.now();
    // Remove user from server
    allUsers = leaveRoom(socket.id, allUsers);
    socket.to(room).emit("chatroom_users", allUsers);
    socket.to(room).emit("receive_message", {
      username: CHAT_BOT,
      message: `${username} left the room`,
      __createdtime__,
    });
    console.log(`${username} left the room`);
  });

  socket.on("disconnect", () => {
    console.log("User has disconnected from chat");
    const user = allUsers.find((user) => user.id == socket.id);
    if (user?.username) {
      allUsers = leaveRoom(socket.id, allUsers);
      /*allUsers = leaveServer(socket.id, allUsers);
      socket.emit("all_users", allUsers);*/
      socket.to(chatRoom).emit("chatroom_users", allUsers);
      socket.to(chatRoom).emit("receive_message", {
        message: `${user.username} disconnected from chat`,
      });
    }
  });

  //
  socket.on("send_message", (data) => {
    const { message, username, room, __createdtime__ } = data;
    io.in(room).emit("receive_message", data); // send the message to the room
    saveMessage(message, username, room, __createdtime__) // save the message in the harperDb
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
  });


  socket.on("send_private_message", (data) => {
    const { privateMessage, currentUser, __createdtime__, room } = data;
    io.in(room).emit("receive_private_messages", data); // send the private message to the private chat
    savePrivateMessage(privateMessage, currentUser, __createdtime__) // save the private message in the harperDb
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
  });
});

/*app.get('/', (request, response) => {
    response.send('')
})*/

// What port the server listens on
server.listen(1337, () =>
  console.log("The server is running on the port 1337")
);
