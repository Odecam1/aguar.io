class Game {
  constructor() {
    this.players = {}
  }

  addPlayer(id) {
    this.players[id] = {
      x: Math.random() * 500,
      y: Math.random() * 500,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      speed: 4,
      target: { x: null, y: null },
    }
  }

  updatePlayerTarget(id, target) {
    if (this.players[id]) {
      this.players[id].target = target
    }
  }

  updatePlayerPositions() {
    Object.values(this.players).map((player) => {
      if (player.target.x !== null && player.target.y !== null) {
        const dx = player.target.x - player.x
        const dy = player.target.y - player.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 2) {
          player.x += (dx / distance) * player.speed
          player.y += (dy / distance) * player.speed
        }
      }
    })
  }

  removePlayer(id) {
    delete this.players[id]
  }

  getPlayers() {
    return this.players
  }
}

export default Game
