import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Tile } from '../entities'
import { DiceResult } from '../entities/Game'
import { Game } from '../entities/Game'

interface GameContextType {
  // 游戏核心状态（只保留gameInstance）
  gameInstance: Game | null
  setGameInstance: (gameInstance: Game | null) => void
  
  // 设备信息
  orientation: 'portrait' | 'landscape'
  isMobile: boolean
  
  // 骰子相关状态
  diceResult: DiceResult | null
  isRolling: boolean
  setDiceResult: (result: DiceResult | null) => void
  setIsRolling: (rolling: boolean) => void
  
  // 游戏操作
  initializeGame: (playerCount: number) => void
  restartGame: () => void
  rollDice: () => void
  endTurn: () => void
  
  // 地图相关
  tiles: Tile[]
  generateTiles: () => void
  activeSpellPending: { card: any | null, playerId: number | null, options?: any };
  
  // 骰子投掷次数相关
  getDiceRollCount: () => number
  canRollDice: () => boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

// 游戏配置常量
const TOTAL_TILES = 81
const BOSS_POSITIONS = [20, 32, 44, 56, 68, 80]
const BOSS_REQUIREMENTS = [8, 12, 12, 14, 18, 20]

// 生成地图格子的函数
export const generateGameTiles = (): Tile[] => {
  const tiles: Tile[] = []
  
  // 预定义特殊格子的位置
  const specialPositions = new Set<number>()
  
  // 添加BOSS位置
  BOSS_POSITIONS.forEach(pos => specialPositions.add(pos))
  
  // 在每个BOSS之间至少添加一个补给站
  for (let i = 0; i < BOSS_POSITIONS.length - 1; i++) {
    const currentBoss = BOSS_POSITIONS[i]
    const nextBoss = BOSS_POSITIONS[i + 1]
    
    // 在BOSS之间随机选择一个位置作为补给站
    const supplyPosition = Math.floor(Math.random() * (nextBoss - currentBoss - 2)) + currentBoss + 1
    specialPositions.add(supplyPosition)
  }
  
  // 添加其他特殊格子（宝箱和反转）
  for (let i = 1; i < TOTAL_TILES; i++) {
    if (!specialPositions.has(i)) {
      if (i % 7 === 0) {
        specialPositions.add(i)
      } else if (i % 9 === 0) {
        specialPositions.add(i)
      }
    }
  }
  
  for (let i = 0; i < TOTAL_TILES; i++) {
    let type: Tile['type'] = 'empty'
    let bossRequirement: number | undefined
    
    if (BOSS_POSITIONS.includes(i)) {
      type = 'boss'
      bossRequirement = BOSS_REQUIREMENTS[BOSS_POSITIONS.indexOf(i)]
    } else if (specialPositions.has(i)) {
      // 确定特殊格子的类型
      if (i % 7 === 0) {
        type = 'treasure'
      } else if (i % 9 === 0) {
        type = 'reverse'
      } else {
        // 不是宝箱也不是反转的，就是补给站
        type = 'supply'
      }
    }
    
    tiles.push(new (Tile as any)(i, type, bossRequirement))
  }
  
  return tiles
}

interface GameProviderProps {
  children: ReactNode
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // 游戏核心状态（只保留gameInstance）
  const [gameInstance, setGameInstance] = useState<Game | null>(null)
  
  // 设备信息
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isMobile, setIsMobile] = useState(false)
  
  // 骰子相关状态
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  
  // 地图相关
  const [tiles, setTiles] = useState<Tile[]>([])
  
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

  // 初始化游戏
  const initializeGame = (playerCount: number) => {
    const game = new Game()
    game.initialize(playerCount)
    
    setGameInstance(game)
  }

  // 重新开始游戏
  const restartGame = () => {
    setGameInstance(null)
    setDiceResult(null)
    setIsRolling(false)
  }

  // 掷骰子逻辑
  const rollDice = () => {
    if (isRolling || !gameInstance || !canRollDice()) return
    
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
        
        // 增加骰子投掷次数
        gameInstance.incrementDiceRollCount()
        
        // 更新gameInstance以触发重新渲染
        setGameInstance(gameInstance)
      } catch (error) {
        console.error('处理骰子结果时出错:', error)
        alert('游戏处理出现错误')
      }
      
      setIsRolling(false)
    }, 1000)
  }
  
  // 获取当前玩家的骰子投掷次数
  const getDiceRollCount = (): number => {
    return gameInstance ? gameInstance.getDiceRollCount() : 0
  }
  
  // 检查是否可以投掷骰子（默认每回合1次，使用法术卡后可以多1次）
  const canRollDice = (): boolean => {
    if (!gameInstance) return false
    return gameInstance.getDiceRollCount() < 2 // 默认1次 + 可能的额外1次
  }

  // 生成地图
  const generateTiles = () => {
    const newTiles = generateGameTiles()
    setTiles(newTiles)
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
    
    // 骰子相关状态
    diceResult,
    isRolling,
    setDiceResult,
    setIsRolling,
    
    // 游戏操作
    initializeGame,
    restartGame,
    rollDice,
    endTurn,
    
    // 地图相关
    tiles,
    generateTiles,
    activeSpellPending: gameInstance ? gameInstance.activeSpellPending : { card: null, playerId: null },
    
    // 骰子投掷次数相关
    getDiceRollCount,
    canRollDice,
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
