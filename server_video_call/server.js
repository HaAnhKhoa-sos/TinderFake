const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

// Route xác nhận khi truy cập web
app.get('/', (req, res) => {
  res.send('🟢 Socket.IO server is running!')
})

const server = http.createServer(app)

// Cấu hình Socket.IO với CORS
const io = new Server(server, {
  cors: {
    origin: "*", // hoặc "https://your-frontend-domain.com"
    methods: ["GET", "POST"]
  }
})

// Lắng nghe các sự kiện video call
io.on('connection', socket => {
  console.log('🔌 Client connected:', socket.id)

  socket.on('video-offer', ({ to, offer }) => {
    io.to(to).emit('video-offer', { from: socket.id, offer })
  })

  socket.on('video-answer', ({ to, answer }) => {
    io.to(to).emit('video-answer', { answer })
  })

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { candidate })
  })

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id)
  })
})

// Lắng nghe trên port (Render sẽ tự gán process.env.PORT)
const PORT = process.env.PORT || 5000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
