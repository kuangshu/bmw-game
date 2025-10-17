import React from 'react'
import { useGameContext } from '../contexts/GameContext'

const PlayerHand: React.FC = () => {
  const { gameInstance } = useGameContext()
  
  // 从gameInstance获取游戏状态
  const gameState = gameInstance ? gameInstance.toJSON() : {
    players: [],
    currentPlayerIndex: 0,
    gameStarted: false,
    gameOver: false,
    winner: null
  }
  
  const player = gameState.players[gameState.currentPlayerIndex]

  if (!player) {
    return null
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{player.name}的手牌</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {player.cards.map(card => (
          <div
            key={card.id}
            className={`p-2 rounded text-xs text-left ${
              card.type === 'energy' 
                ? 'bg-yellow-100 border border-yellow-300'
                : 'bg-blue-100 border border-blue-300'
            }`}
          >
            <div className="font-semibold">
              {card.name}
            </div>
            <div className="text-gray-600">{card.description}</div>
          </div>
        ))}
      </div>
      
      {player.cards.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          暂无手牌
        </div>
      )}
    </div>
  )
}

export default PlayerHand