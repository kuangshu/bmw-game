import React from 'react'
import { GameState, Player, Card } from '../types/game'

interface PlayerHandProps {
  player: Player
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}

// 模拟卡片数据
const generateInitialCards = (): Card[] => {
  const cards: Card[] = []
  
  // 能量卡
  for (let i = 1; i <= 3; i++) {
    cards.push({
      id: i,
      type: 'energy',
      value: i * 2, // 2, 4, 6
      description: `提供 ${i * 2} 点能量`
    })
  }
  
  // 法术卡
  cards.push({
    id: 4,
    type: 'spell',
    value: 0,
    effect: 'double_move',
    description: '下次移动距离翻倍'
  })
  
  return cards
}

const PlayerHand: React.FC<PlayerHandProps> = ({ player, gameState, setGameState }) => {
  const useCard = (card: Card) => {
    if (card.type === 'energy') {
      // 使用能量卡
      const updatedPlayers = gameState.players.map(p => 
        p.id === player.id 
          ? { ...p, energy: p.energy + card.value, cards: p.cards.filter(c => c.id !== card.id) }
          : p
      )
      
      setGameState({
        ...gameState,
        players: updatedPlayers
      })
    } else if (card.type === 'spell') {
      // 使用法术卡（这里可以扩展具体效果）
      alert(`使用法术卡: ${card.description}`)
      
      const updatedPlayers = gameState.players.map(p => 
        p.id === player.id 
          ? { ...p, cards: p.cards.filter(c => c.id !== card.id) }
          : p
      )
      
      setGameState({
        ...gameState,
        players: updatedPlayers
      })
    }
  }

  // 初始化玩家手牌（如果还没有）
  React.useEffect(() => {
    if (player.cards.length === 0) {
      const initialCards = generateInitialCards()
      const updatedPlayers = gameState.players.map(p => 
        p.id === player.id ? { ...p, cards: initialCards } : p
      )
      
      setGameState({
        ...gameState,
        players: updatedPlayers
      })
    }
  }, [player.id])

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{player.name}的手牌</h3>
      
      <div className="mb-4">
        <span className="text-sm text-gray-600">能量: </span>
        <span className="font-bold text-green-600">{player.energy}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {player.cards.map(card => (
          <button
            key={card.id}
            onClick={() => useCard(card)}
            className={`p-2 rounded text-xs text-left ${
              card.type === 'energy' 
                ? 'bg-yellow-100 hover:bg-yellow-200 border border-yellow-300'
                : 'bg-blue-100 hover:bg-blue-200 border border-blue-300'
            }`}
          >
            <div className="font-semibold">
              {card.type === 'energy' ? '能量卡' : '法术卡'}
            </div>
            <div className="text-gray-600">{card.description}</div>
          </button>
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