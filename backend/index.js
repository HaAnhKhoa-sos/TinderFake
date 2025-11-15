// backend/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// 🔹 Load .env sớm
dotenv.config()

// 🔹 Khởi tạo app trước
const app = express()
app.use(cors())
app.use(express.json())

// 🔹 Import routes SAU khi app đã có
import matchRoutes from './routes/matchRoutes.js'
import gameRoutes from './routes/gameRoutes.js'

// 🔹 Gắn routes
app.use('/api/match', matchRoutes)
app.use('/api/games', gameRoutes)

// 🔹 Route kiểm tra server
app.get('/', (req, res) => {
  res.send('💘 Match API is running')
})

// 🔹 Chạy server
const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`))
