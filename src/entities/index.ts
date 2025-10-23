// 实体类导出文件
// 导出所有实体类和类型
export { CardDeck } from './CardDeck'
export { BaseTile as Tile, BossTile, EmptyTile, TreasureTile, SupplyTile, ReverseTile } from './Tile'
export type { TileType } from './Tile'
export { GameBoard } from './GameBoard'
export { Game } from './Game'
export { Player } from './Player'
export { Dice } from './Dice'
export type { GameState } from './Game'
export type { DiceResult } from './Dice'
export type { PlayerRole, PlayerData, Card } from './Player'
export { GameEventSystem } from './GameEventSystem'
export type { GameEventType, GameEventData } from './GameEventSystem'