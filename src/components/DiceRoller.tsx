import React, { useState } from 'react'
import { GameState, DiceResult, TileType } from '../types/game'

interface DiceRollerProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}

const BOSS_POSITIONS = [20, 32, 44, 56, 68, 80]
const BOSS_REQUIREMENTS = [8, 12, 12, 14, 18, 20]

const getTileType = (position: number): TileType => {
  if (BOSS_POSITIONS.includes(position)) return 'boss'
  if (position % 7 === 0 && position > 0) return 'treasure'
  if (position % 9 === 0 && position > 0) return 'reverse'
  if (position % 11 === 0 && position > 0) return 'supply'
  return 'empty'
}

const DiceRoller: React.FC<DiceRollerProps> = ({ gameState, setGameState }) => {
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null)
  const [isRolling, setIsRolling] = useState(false)

  const handleTileEffect = (playerPosition: number, playerEnergy: number) => {
    const tileType = getTileType(playerPosition)
    
    switch (tileType) {
      case 'boss':
        const bossIndex = BOSS_POSITIONS.indexOf(playerPosition)
        const requirement = BOSS_REQUIREMENTS[bossIndex]
        
        if (playerEnergy >= requirement) {
          alert(`🎉 击败BOSS！消耗了${requirement}点能量`)
          return {
            energyChange: -requirement,
            cardsGained: 1
          }
        } else {
          const previousBoss = BOSS_POSITIONS.filter(pos => pos < playerPosition).pop()
          const newPosition = previousBoss !== undefined ? previousBoss : 0
          alert(`💥 BOSS太强了！需要${requirement}点能量，你只有${playerEnergy}点。回到上一个BOSS位置`)
          return {
            positionChange: newPosition - playerPosition,
            message: `回到位置 ${newPosition}`
          }
        }
        
      case 'treasure':
        alert('🎁 获得一张事件牌！')
        return { cardsGained: 1 }
        
      case 'reverse':
        alert('🔄 进入反转格，下一回合后退')
        return { reverseNextTurn: true }
        
      case 'supply':
        alert('⚡ 获得2张功能牌！')
        return { cardsGained: 2 }
        
      default:
        return {}
    }
  }

  const rollDice = () => {
    if (isRolling) return
    
    setIsRolling(true)
    
    setTimeout(() => {
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      const result: DiceResult = {
        dice1,
        dice2,
        total: dice1 + dice2
      }
      
      setDiceResult(result)
      setIsRolling(false)
      
      const currentPlayerIndex = gameState.currentPlayerIndex
      const players = [...gameState.players]
      const currentPlayer = { ...players[currentPlayerIndex] }
      
      // 移动玩家
      const newPosition = Math.min(currentPlayer.position + result.total, 80)
      currentPlayer.position = newPosition
      
      // 处理格子效果
      const effect = handleTileEffect(newPosition, currentPlayer.energy)
      
      if (effect.positionChange) {
        currentPlayer.position += effect.positionChange
      }
      
      if (effect.energyChange) {
        currentPlayer.energy = Math.max(0, currentPlayer.energy + effect.energyChange)
      }
      
      // 检查游戏是否结束
      let gameOver = false
      let winner = null
      
      if (newPosition >= 80) {
        gameOver = true
        winner = currentPlayer
        alert(`🎊 ${currentPlayer.name} 到达终点，游戏结束！`)
      }
      
      players[currentPlayerIndex] = currentPlayer
      
      // 切换到下一个玩家
      const nextPlayerIndex = gameOver ? currentPlayerIndex : (currentPlayerIndex + 1) % players.length
      
      setGameState({
        ...gameState,
        players,
        currentPlayerIndex: nextPlayerIndex,
        gameOver,
        winner
      })
    }, 1000)
  }

  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">掷骰子</h3>
      
      <div className="flex justify-center space-x-3 md:space-x-4 mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl transition-all duration-300 ${isRolling ? 'animate-spin' : ''}`}>
          {diceResult?.dice1 || '?'}
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl transition-all duration-300 ${isRolling ? 'animate-spin' : ''}`}>
          {diceResult?.dice2 || '?'}
        </div>
      </div>
      
      {diceResult && (
        <div className="text-center mb-3 md:mb-4">
          <p className="text-xs md:text-sm text-gray-600">总计: {diceResult.total}</p>
        </div>
      )}
      
      <button
        onClick={rollDice}
        disabled={isRolling || gameState.gameOver}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-3 md:py-2 md:px-4 rounded-lg transition-colors text-sm md:text-base"
      >
        {isRolling ? '掷骰子中...' : gameState.gameOver ? '游戏结束' : '掷骰子'}
      </button>
      
      <div className="mt-3 text-xs text-gray-500">
        当前玩家: {gameState.players[gameState.currentPlayerIndex]?.name}
      </div>
    </div>
  )
}

export default DiceRoller