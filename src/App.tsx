import React, { FC, useEffect, useState } from "react"
import { io } from "socket.io-client"

const socket = io("http://localhost:3000")

type Player = {
  x: number
  y: number
  color: string
  score: number
}

type Grain = {
  x: number
  y: number
}

type GameState = {
  players: { [key: string]: Player }
  grains: Grain[]
}

const App: FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    grains: [],
  })
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)

  useEffect(() => {
    socket.on("connect", () => setCurrentPlayerId(socket.id || null))

    socket.on("updateGame", (state: GameState) => {
      setGameState(state)
    })

    return () => {
      socket.off("updateGame")
      socket.off("connect")
    }
  }, [])

  const currentPlayer = currentPlayerId
    ? gameState.players[currentPlayerId]
    : null

  const playerRadius = currentPlayer ? currentPlayer.score * 2 + 20 : 20

  const calCamPosition = (
    windowDimention: number,
    currentPlayerDimention: number | undefined,
    cameraScale: number
  ) =>
    currentPlayerDimention
      ? Math.max(
          0,
          Math.min(
            (2000 - windowDimention) / cameraScale, // Ajuste la dimension de la fenêtre selon l'échelle
            (currentPlayerDimention - windowDimention / 2) / cameraScale // Ajuste la position du joueur selon l'échelle
          )
        )
      : 0

  const cameraScale = Math.min(1, 200 / (80 + playerRadius))
  const cameraX = calCamPosition(
    window.innerWidth,
    currentPlayer?.x,
    cameraScale
  )
  const cameraY = calCamPosition(
    window.innerHeight,
    currentPlayer?.y,
    cameraScale
  )

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    cameraScale: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()

    const x = (e.clientX - rect.left) / cameraScale
    const y = (e.clientY - rect.top) / cameraScale

    socket.emit("updateTarget", { x, y })
  }

  return (
    <div className="relative overflow-hidden w-screen h-screen bg-gray-200">
      <div
        onMouseMove={(e) => handleMouseMove(e, cameraScale)}
        className="absolute w-[2000px] h-[2000px]"
        style={{
          transform: `translate(${-cameraX}px, ${-cameraY}px) scale(${cameraScale})`,
          backgroundImage: `
            linear-gradient(to right, #ccc 1px, transparent 1px),
            linear-gradient(to bottom, #ccc 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      >
        {/* Grains */}
        {gameState.grains.map((grain, index) => (
          <div
            key={index}
            className="absolute w-4 h-4 bg-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: grain.x - 8, top: grain.y - 8 }}
          />
        ))}

        {/* Players */}
        {Object.entries(gameState.players).map(([id, player]) => {
          const playerRadius = player.score * 2 + 20
          return (
            <div key={id} className="relative">
              <div
                className="absolute"
                style={{
                  width: playerRadius * 2,
                  height: playerRadius * 2,
                  left: player.x - playerRadius,
                  top: player.y - playerRadius,
                  backgroundColor: player.color,
                  borderRadius: "50%",
                }}
              />
            </div>
          )
        })}
      </div>
      <span className="bg-gray-200/90 ">Score : {currentPlayer?.score}</span>
    </div>
  )
}

export default App
