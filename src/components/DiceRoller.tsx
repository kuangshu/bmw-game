import React, { useState } from 'react'
import { GameState, DiceResult, TileType } from '../types/game'
import { Player } from '../entities/Player'

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

  const handleTileEffect = (playerPosition: number, playerEnergy: number, diceTotal: number) => {
    const tileType = getTileType(playerPosition)
    
    switch (tileType) {
      case 'boss':
        const bossIndex = BOSS_POSITIONS.indexOf(playerPosition)
        const requirement = BOSS_REQUIREMENTS[bossIndex]
        
        // 如果能量足够，直接击败BOSS
        if (playerEnergy >= requirement) {
          alert(`🎉 击败BOSS！消耗了${requirement}点能量`)
          return {
            energyChange: -requirement,
            cardsGained: 1
          }
        } else {
          // 能量不足，启动BOSS战斗
          const previousBoss = BOSS_POSITIONS.filter(pos => pos < playerPosition).pop()
          const originalPosition = previousBoss !== undefined ? previousBoss : 0
          
          return {
            startBossBattle: true,
            bossPosition: playerPosition,
            bossRequirement: requirement,
            originalPosition: originalPosition,
            remainingSteps: diceTotal - (playerPosition - originalPosition)
          }
        }
        
      case 'treasure':
        alert('🎁 获得一张事件牌！')
        return { cardsGained: 1 }
        
      case 'reverse':
        alert('🔄 进入反转格，下一回合后退')
        return { positionChange: -3, reverseNextTurn: true }
        
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
      let dice1, dice2, total
      
      // 检查是否有定身术效果
      if (gameState.activeSpells?.fixedDice) {
        total = gameState.activeSpells.fixedDice
        dice1 = Math.min(6, Math.floor(total / 2))
        dice2 = total - dice1
      } else {
        dice1 = Math.floor(Math.random() * 6) + 1
        dice2 = Math.floor(Math.random() * 6) + 1
        total = dice1 + dice2
      }
      
      const result: DiceResult = {
        dice1,
        dice2,
        total
      }
      
      setDiceResult(result)
      setIsRolling(false)
      
      const currentPlayerIndex = gameState.currentPlayerIndex
      const players = [...gameState.players]
      const currentPlayerData = players[currentPlayerIndex]
      const currentPlayer = Player.fromData(currentPlayerData)
      
      if (gameState.activeSpells?.swapTarget) {
        const targetPlayerId = gameState.activeSpells.swapTarget
        const targetPlayerIndex = players.findIndex(p => p.id === targetPlayerId)
        
        if (targetPlayerIndex !== -1 && targetPlayerIndex !== currentPlayerIndex) {
          // 交换位置
          const targetPlayer = Player.fromData(players[targetPlayerIndex])
          const tempPosition = currentPlayer.position
          currentPlayer.position = targetPlayer.position
          targetPlayer.position = tempPosition
          
          alert(`🔄 ${currentPlayer.name} 与 ${targetPlayer.name} 交换了位置`)
          
          // 更新玩家数组
          players[currentPlayerIndex] = currentPlayer.toJSON()
          players[targetPlayerIndex] = targetPlayer.toJSON()
          
          // 清除法术效果
          const newActiveSpells = { ...gameState.activeSpells }
          delete newActiveSpells.swapTarget
          
          setGameState({
            ...gameState,
            players,
            activeSpells: Object.keys(newActiveSpells).length > 0 ? newActiveSpells : undefined
          })
          setIsRolling(false)
          return
        }
      }
      
      // 移动玩家
      currentPlayer.move(result.total)
      
      // 处理格子效果
      const effect = handleTileEffect(currentPlayer.position, currentPlayer.energy, result.total)
      
      if (effect.startBossBattle) {
        // 启动BOSS战斗
        setGameState({
          ...gameState,
          players,
          bossBattle: {
            position: effect.bossPosition!,
            requirement: effect.bossRequirement!,
            originalPosition: effect.originalPosition!,
            remainingSteps: effect.remainingSteps!
          }
        })
        return
      }
      
      if (effect.positionChange) {
        currentPlayer.move(effect.positionChange)
      }
      
      if (effect.energyChange) {
        if (effect.energyChange > 0) {
          currentPlayer.addEnergy()
        } else {
          currentPlayer.consumeEnergy()
        }
      }
      
      // 检查游戏是否结束
      let gameOver = false
      let winner = null
      
      if (currentPlayer.position >= 80) {
        gameOver = true
        winner = currentPlayer.toJSON()
        alert(`🎊 ${currentPlayer.name} 到达终点，游戏结束！`)
      }
      
      players[currentPlayerIndex] = currentPlayer.toJSON()
      
      // 检查是否有分身术效果
      let nextPlayerIndex = currentPlayerIndex
      let newActiveSpells = { ...gameState.activeSpells }
      
      if (gameState.activeSpells?.extraTurn) {
        // 分身术：不清除当前玩家回合
        delete newActiveSpells.extraTurn
      } else {
        // 正常切换到下一个玩家
        nextPlayerIndex = gameOver ? currentPlayerIndex : (currentPlayerIndex + 1) % players.length
      }
      
      // 清除定身术效果（如果使用了）
      if (gameState.activeSpells?.fixedDice) {
        delete newActiveSpells.fixedDice
      }
      
      setGameState({
        ...gameState,
        players,
        currentPlayerIndex: nextPlayerIndex,
        gameOver,
        winner,
        activeSpells: Object.keys(newActiveSpells).length > 0 ? newActiveSpells : undefined
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