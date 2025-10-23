import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DiceResult } from '../entities/Dice'
import { Game } from '../entities/Game'

interface GameContextType {
  // 游戏核心状态（只保留gameInstance）
  gameInstance: Game | null
  setGameInstance: (gameInstance: Game | null) => void
  
  // 设备信息
  orientation: 'portrait' | 'landscape'
  isMobile: boolean
  
  // 游戏操作
  initializeGame: (playerCount: number) => void
  restartGame: () => void
  rollDice: () => void
  endTurn: () => void
  
  // 骰子投掷次数相关
  getDiceRollCount: () => number
  canRollDice: () => boolean
  getDiceResult: () => DiceResult | null
  getIsRolling: () => boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

interface GameProviderProps {
  children: ReactNode
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // 游戏核心状态（只保留gameInstance）
  const [gameInstance, setGameInstance] = useState<Game | null>(null)
  
  // 设备信息
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isMobile, setIsMobile] = useState(false)
  
  // 检测设备和屏幕方向
  useEffect(() => {
    const checkDeviceAndOrientation = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkDeviceAndOrientation()
    window.addEventListener('resize', checkDeviceAndOrientation)
    
    return () => window.removeEventListener('resize', checkDeviceAndOrientation)
  }, [])

  // 初始化游戏（异步方法，支持角色选择）
  const initializeGame = async (playerCount: number) => {
    const game = new Game()
    await game.initialize(playerCount)
    
    setGameInstance(game)
  }

  // 重新开始游戏
  const restartGame = () => {
    setGameInstance(null)
  }

  // 掷骰子逻辑
  const rollDice = async () => {
    if (!gameInstance || !canRollDice()) return
    
    try {
      // 使用Game实例的rollDice方法
      const result = await gameInstance.rollDice()
      
      // 处理骰子结果
      await gameInstance.processDiceRoll(result)
      
      // 增加骰子投掷次数
      gameInstance.incrementDiceRollCount()
      
      // 更新gameInstance以触发重新渲染
      setGameInstance(gameInstance)
    } catch (error) {
      console.error('处理骰子结果时出错:', error)
      alert('游戏处理出现错误')
    }
  }
  
  // 获取当前玩家的骰子投掷次数
  const getDiceRollCount = (): number => {
    return gameInstance ? gameInstance.getDiceRollCount() : 0
  }
  
  // 检查是否可以投掷骰子（默认每回合1次，使用法术卡后可以额外增加次数）
  const canRollDice = (): boolean => {
    if (!gameInstance) return false
    return gameInstance.canRollDice()
  }

  // 获取当前骰子结果
  const getDiceResult = (): DiceResult | null => {
    return gameInstance ? gameInstance.getDiceResult() : null
  }

  // 获取是否正在摇骰子
  const getIsRolling = (): boolean => {
    return gameInstance ? gameInstance.dice.isRolling : false
  }

  const endTurn = () => {
    if (gameInstance) {
      gameInstance.nextTurn();
      setGameInstance(gameInstance);
    }
  }

  const value: GameContextType = {
    // 游戏核心状态
    gameInstance,
    setGameInstance,
    
    // 设备信息
    orientation,
    isMobile,
    
    // 游戏操作
    initializeGame,
    restartGame,
    rollDice,
    endTurn,
    
    // 骰子投掷次数相关
    getDiceRollCount,
    canRollDice,
    getDiceResult,
    getIsRolling,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export const useGameContext = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}