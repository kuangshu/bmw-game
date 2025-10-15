// 玩家角色类型定义
export type PlayerRole = 'warrior' | 'mage' | 'rogue' | 'cleric'

// 前进方向类型定义
export type Direction = 'forward' | 'backward'

// 用于序列化的玩家数据接口
export interface PlayerData {
  id: number
  name: string
  role: PlayerRole
  position: number
  cards: Card[]
  energy: number
  direction: Direction
}

export interface Card {
  id: number
  type: 'energy' | 'spell'
  value: number
  name: string
  effect?: string
  description: string
}

/**
 * 地图格子类型定义
 * - empty: 普通格子，无特殊效果
 * - treasure: 宝箱格，触发1张事件牌
 * - reverse: 反转格，玩家转向一个回合，在下一个回合结束时回到前进方向
 * - supply: 补给站，获得2张功能牌
 * - boss: BOSS格，进入BOSS战斗需要足够能量击败BOSS，否则退回上一关BOSS的格子
 */
export type TileType = 'empty' | 'treasure' | 'reverse' | 'supply' | 'boss'

export interface Tile {
  position: number
  type: TileType
  bossRequirement?: number
}
export interface GameState {
  players: PlayerData[]
  currentPlayerIndex: number
  gameStarted: boolean
  gameOver: boolean
  winner: PlayerData | null
  bossBattle?: {
    position: number
    requirement: number
    selectedCardId?: number
    originalPosition: number
    remainingSteps: number
  }
  activeSpells?: {
    fixedDice?: number
    extraTurn?: boolean
    swapTarget?: number
    spellShield?: number
  }
}

export interface DiceResult {
  dice1: number
  dice2: number
  total: number
}