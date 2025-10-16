import { Tile, TileData } from './Tile'

export class GameBoard {
  private _tiles: Tile[]
  private readonly _totalTiles: number

  constructor(totalTiles: number = 81) {
    this._totalTiles = totalTiles
    this._tiles = []
  }

  // 获取所有格子
  get tiles(): Tile[] {
    return [...this._tiles]
  }

  // 获取总格子数
  get totalTiles(): number {
    return this._totalTiles
  }

  // 根据位置获取格子
  getTile(position: number): Tile | undefined {
    return this._tiles.find(tile => tile.position === position)
  }

  // 设置格子
  setTiles(tiles: Tile[]): void {
    if (tiles.length !== this._totalTiles) {
      throw new Error(`格子数量不匹配，期望 ${this._totalTiles} 个，实际 ${tiles.length} 个`)
    }
    
    // 验证位置连续性
    for (let i = 0; i < this._totalTiles; i++) {
      if (!tiles.some(tile => tile.position === i)) {
        throw new Error(`缺少位置 ${i} 的格子`)
      }
    }

    this._tiles = [...tiles].sort((a, b) => a.position - b.position)
  }

  // 生成标准游戏地图
  generateStandardBoard(): void {
    const BOSS_POSITIONS = [20, 32, 44, 56, 68, 80]
    const BOSS_REQUIREMENTS = [8, 12, 12, 14, 18, 20]
    
    const tiles: Tile[] = []
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
    for (let i = 1; i < this._totalTiles; i++) {
      if (!specialPositions.has(i)) {
        if (i % 7 === 0) {
          specialPositions.add(i)
        } else if (i % 9 === 0) {
          specialPositions.add(i)
        }
      }
    }
    
    // 创建所有格子
    for (let i = 0; i < this._totalTiles; i++) {
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

    this.setTiles(tiles)
  }

  // 序列化方法
  toJSON(): any[] {
    return this._tiles.map(tile => tile.toJSON())
  }

  // 从数据对象创建GameBoard实例
  static fromData(tilesData: TileData[], totalTiles: number = 81): GameBoard {
    const board = new GameBoard(totalTiles)
    const tiles = tilesData.map(data => Tile.fromData(data))
    board.setTiles(tiles)
    return board
  }
}