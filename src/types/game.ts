export interface Player {
  id: number
  name: string
  position: number
  cards: Card[]
  energy: number
}

export interface Card {
  id: number
  type: 'energy' | 'spell'
  value: number
  effect?: string
  description: string
}

export type TileType = 'empty' | 'treasure' | 'reverse' | 'supply' | 'boss'

export interface Tile {
  position: number
  type: TileType
  bossRequirement?: number
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  gameStarted: boolean
  gameOver: boolean
  winner: Player | null
}

export interface DiceResult {
  dice1: number
  dice2: number
  total: number
}