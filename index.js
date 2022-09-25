const express = require('express')
require('dotenv').config()
const app = express()
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

// "Cross-Origin Resource Sharing is an HTTP-header based mechanism that allows a server to indicate any origins(domain, scheme or port)
// ..Other than its own from which a browser should permit loading resources." - https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
app.use(cors())

const saveMessage = require('./services/save-message') // save the messages from harperDb
const getMessage = require('./services/get-messages') // get the messages from harperDb
const getMessages = require('./services/get-messages')

// Creates a server on the computer
const server = http.createServer(app)

// Creates io server using CORS from origin with post and get methods
const io = new Server(server, {
    cors: {
        methods: ['GET', 'POST'],
        origin: 'http://localhost:3000',
    },
})

const leaveRoom = require('./utils/leave-room') // handle user leaving room

// Bot for sending messages in the rooms for events triggering such as join and leave etc.
const CHAT_BOT = 'ChatBot'

let currentRoom = '' // Any of our rooms like potato, sandwich, football etc.
let usersInRoom = [] // Lists for the current users in the room

// Socket.io-client listens for client connections
io.on('connection', (socket) => {
    console.log(`A User Has Connected: ${socket.id}`)

    // Socket adds user to fitting room
    socket.on('join_room', (data) => {
        const { username, room } = data // The data that`s sent from the client during join_room event being emitted
        socket.join(room) // User joins socket room

        getMessages(room)
            .then((last20Messages) => {
                socket.emit('last_20_messages', last20Messages)
            })
            .catch((err) => console.log(err))
    })

    let timeStamp = Date.now() // Snapshot the current timestamp

    socket.on('leave_room', (data) => {
        const { username, room } = data
        socket.leave(room)
        const timeStamp = date.now()
        // Remove user from server
        usersInRoom = leaveRoom(socket.id, usersInRoom)
        socket.to(room).emit('chatroom_users', usersInRoom)
        socket.to(room).emit('recieve_message', {
            username: CHAT_BOT,
            message: `${username} left the room`,
            timeStamp,
        })
        console.log(`${username} left the room`);
    })

    socket.on('disconnect', () => {
        console.log('User has disconnected from chat')
        const user = usersInRoom.find((user) => user.id == socket.id)
        if (user?.username) {
            usersInRoom = leaveRoom(socket.id, usersInRoom)
            socket.to(currentRoom).emit('chatroom_users', usersInRoom)
            socket.to(currentRoom).emit('recieve_message', {
                message: `${user.username} disconnected from chat`,
            })
        }
    })
    
    // 
    socket.to(room).emit('recieve_message', {
        message: `${username} joined the room`,
        username: CHAT_BOT,
        timeStamp,
    })

    socket.emit('recieve_message', {
        message: `I bid you welcome ${username}`,
        username: CHAT_BOT,
        timeStamp,
    })

    // Saves a new user to correlating room
    currentRoom = room
    usersInRoom.push({ id: socket.id, username, room })
    roomUsers = usersInRoom.filter((user) => user.room === room)
    socket.to(room).emit('chatroom_users', roomUsers)
    socket.emit('chatroom_users', roomUsers)

    socket.on('send_message', (data) => {
        const { message, username, room, timeStamp } = data
        io.in(room).emit('recieve_message', data) // send the message to the room
        saveMessage(message, username, room, timeStamp) // save the message in the harperDb
            .then((response => console.log(response))) 
            .cathc((err) => console.log(err))
    })

})

/*app.get('/', (request, response) => {
    response.send('')
})*/

// What port the server listens on
server.listen(1337, () => 'The server is running on the port 1337')