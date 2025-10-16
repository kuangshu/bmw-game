import React, { useState } from 'react'
import { GameState, DiceResult } from '../entities/Game'
import { Game } from '../entities/Game'

interface DiceRollerProps {
  gameState: GameState
  gameInstance: Game | null
  onGameUpdate: (gameState: GameState) => void
}

const DiceRoller: React.FC<DiceRollerProps> = ({ gameState, gameInstance, onGameUpdate }) => {
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null)
  const [isRolling, setIsRolling] = useState(false)

  const rollDice = () => {
    if (isRolling || !gameInstance) return
    
    setIsRolling(true)
    
    setTimeout(() => {
      // 生成骰子结果
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      const total = dice1 + dice2
      
      const result: DiceResult = {
        dice1,
        dice2,
        total
      }
      
      setDiceResult(result)
      
      try {
        // 使用Game实例处理骰子结果
        gameInstance.processDiceRoll(result)
        
        // 更新游戏状态
        onGameUpdate(gameInstance.toJSON())
      } catch (error) {
        console.error('处理骰子结果时出错:', error)
        alert('游戏处理出现错误')
      }
      
      setIsRolling(false)
    }, 1000)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">掷骰子</h3>
      
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