import cors from "cors"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"

class Game {
  constructor() {
    this.players = {}
    this.grains = []
    this.mapSize = 2000
    this.initGrains(500) // Génère 50 grains aléatoires
  }

  initGrains(count) {
    for (let i = 0; i < count; i++) {
      this.grains.push(this.generateGrain())
    }
  }

  generateGrain() {
    return {
      x: Math.random() * this.mapSize,
      y: Math.random() * this.mapSize,
    }
  }

  addPlayer(id) {
    this.players[id] = {
      x: Math.random() * this.mapSize,
      y: Math.random() * this.mapSize,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      speed: 4,
      target: { x: null, y: null },
      score: 0,
    }
  }

  updatePlayerTarget(id, target) {
    if (this.players[id]) {
      this.players[id].target = target
    }
  }

  updatePlayerPositions() {
    Object.values(this.players).forEach((player) => {
      if (player.target.x !== null && player.target.y !== null) {
        const dx = player.target.x - player.x
        const dy = player.target.y - player.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 2) {
          player.x += (dx / distance) * player.speed
          player.y += (dy / distance) * player.speed
        }
      }

      this.checkGrainCollisions(player)
    })
  }

  checkGrainCollisions(player) {
    const playerRadius = player.score * 2 + 20
    this.grains.forEach((grain, index) => {
      const dx = grain.x - player.x
      const dy = grain.y - player.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < playerRadius) {
        player.score += 1
        this.grains[index] = this.generateGrain()
      }
    })
  }

  removePlayer(id) {
    delete this.players[id]
  }

  getGameState() {
    return {
      players: this.players,
      grains: this.grains,
    }
  }
}

const app = express()
app.use(cors())

const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
})

const game = new Game()

setInterval(() => {
  game.updatePlayerPositions()
  io.emit("updateGame", game.getGameState())
}, 16)

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)
  game.addPlayer(socket.id)

  socket.on("updateTarget", (target) => {
    game.updatePlayerTarget(socket.id, target)
  })

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)
    game.removePlayer(socket.id)
  })
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
