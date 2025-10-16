import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Tile } from '../entities/Tile'

interface GameContextType {
  tiles: Tile[]
  setTiles: (tiles: Tile[]) => void
  generateTiles: () => void
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
    
    tiles.push(new Tile(i, type, bossRequirement))
  }
  
  return tiles
}

interface GameProviderProps {
  children: ReactNode
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [tiles, setTiles] = useState<Tile[]>([])
  
  const generateTiles = () => {
    const newTiles = generateGameTiles()
    setTiles(newTiles)
  }

  const value: GameContextType = {
    tiles,
    setTiles,
    generateTiles
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