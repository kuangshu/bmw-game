 import { Player, PlayerData } from './Player'
 import { CardDeck } from './CardDeck'
 import { GameBoard } from './GameBoard'
 import { Tile } from './Tile'
 
// 游戏状态接口
export interface GameState {
  players: PlayerData[]
  currentPlayerIndex: number
  gameStarted: boolean
  gameOver: boolean
  winner: PlayerData | null
   bossBattle?: {
     position: number
     requirement: number
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

// 骰子结果接口
export interface DiceResult {
  dice1: number
  dice2: number
  total: number
}

// BOSS战斗状态接口
interface BossBattleState {
  position: number           // BOSS位置
  requirement: number        // 所需能量
  originalPosition: number  // 玩家原始位置
  remainingSteps: number    // 剩余步数
  selectedCards: number[]   // 已选择的卡片ID
}

 export class Game {
   private _players: Player[]
   private _currentPlayerIndex: number
   private _gameStarted: boolean
   private _gameOver: boolean
   private _winner: Player | null
   private _cardDeck: CardDeck
   private _gameBoard: GameBoard
   private _bossBattleState: BossBattleState | null = null

  constructor() {
    this._players = []
    this._currentPlayerIndex = 0
    this._gameStarted = false
    this._gameOver = false
    this._winner = null
    this._cardDeck = new CardDeck()
    this._gameBoard = new GameBoard()
  }

  // Getters
  get players(): Player[] { return [...this._players] }
  get currentPlayerIndex(): number { return this._currentPlayerIndex }
  get gameStarted(): boolean { return this._gameStarted }
  get gameOver(): boolean { return this._gameOver }
  get winner(): Player | null { return this._winner }
  get cardDeck(): CardDeck { return this._cardDeck }
   get gameBoard(): GameBoard { return this._gameBoard }
   get bossBattleState(): BossBattleState | null { return this._bossBattleState }

  // 初始化游戏
  initialize(playerCount: number): void {
    if (playerCount < 2 || playerCount > 6) {
      throw new Error('玩家数量必须在2-6人之间')
    }

    // 重置游戏状态
    this._players = []
    this._currentPlayerIndex = 0
    this._gameStarted = true
    this._gameOver = false
    this._winner = null

    // 创建牌堆
    this._cardDeck = CardDeck.createStandardDeck()

    // 创建玩家并分配起始手牌
    for (let i = 0; i < playerCount; i++) {
      const startingCards = this._cardDeck.draw(4)
      const player = new Player(
        i + 1,
        `玩家 ${i + 1}`,
        'warrior',
        0,
        startingCards
      )
      this._players.push(player)
    }

    // 生成游戏地图
    this._gameBoard.generateStandardBoard()
  }

  // 获取当前玩家
  getCurrentPlayer(): Player {
    if (!this._gameStarted || this._players.length === 0) {
      throw new Error('游戏未开始或没有玩家')
    }
    return this._players[this._currentPlayerIndex]
  }

  // 处理骰子结果
  processDiceRoll(diceResult: DiceResult): void {
    if (!this._gameStarted || this._gameOver) {
      throw new Error('游戏未开始或已结束')
    }

    const currentPlayer = this.getCurrentPlayer()
    
    // 移动玩家
    currentPlayer.move(diceResult.total)
    
    // 检查是否到达终点
    if (currentPlayer.position >= this._gameBoard.totalTiles - 1) {
      this.endGame(currentPlayer)
      return
    }

    // 处理格子效果
    this.processTileEffect(currentPlayer, diceResult.total)

    // 切换到下一个玩家
    this.nextTurn()
  }

  // 处理格子效果
  private processTileEffect(player: Player, diceTotal: number): void {
    const tile = this._gameBoard.getTile(player.position)
    if (!tile) return

    switch (tile.type) {
      case 'treasure':
        // 触发宝箱事件，抽取一张牌
        if (!this._cardDeck.isEmpty()) {
          const drawnCard = this._cardDeck.draw(1)[0]
          player.addCard(drawnCard)
        }
        break
      
      case 'supply':
        // 补给站，获得2张牌
        if (!this._cardDeck.isEmpty()) {
          const drawnCards = this._cardDeck.draw(Math.min(2, this._cardDeck.size))
          drawnCards.forEach(card => player.addCard(card))
        }
        break
      
      case 'reverse':
        // 反转方向一个回合
        player.reverseDirection()
        break
      
      case 'boss':
        // BOSS战斗逻辑
        this.handleBossBattle(player, tile, diceTotal)
        break
      
      default:
        // 普通格子无特殊效果
        break
    }
  }

  // 切换到下一个回合
  // 处理BOSS战斗
  // 处理BOSS战斗
   private handleBossBattle(player: Player, tile: Tile, diceTotal: number): void {
     if (!tile.bossRequirement) return
     
     // 所有BOSS战斗都通过卡片选择模式进行
     this.startCardBasedBossBattle(player, tile, diceTotal)
   }
  
  // 启动基于卡片的BOSS战斗
  private startCardBasedBossBattle(player: Player, tile: Tile, diceTotal: number): void {
    // 设置BOSS战斗状态，等待玩家选择卡片
    this._bossBattleState = {
      position: tile.position,
      requirement: tile.bossRequirement!,
      originalPosition: player.position,
      remainingSteps: diceTotal,
      selectedCards: []
    }
    
    console.log(`⚔️ ${player.name} 进入BOSS战斗！需要 ${tile.bossRequirement} 点能量`)
    console.log(`请选择要使用的卡片组合，或者弃掉一张卡片回到上一关BOSS位置`)
  }
  
  // 处理玩家出牌
  playCardsForBossBattle(player: Player, cardIds: number[]): boolean {
    if (!this._bossBattleState) return false
    
    const totalEnergy = this.calculateCardsEnergy(player, cardIds)
    
    if (totalEnergy >= this._bossBattleState.requirement) {
      // 成功击败BOSS
      this.removeSelectedCards(player, cardIds)
      console.log(`🎉 ${player.name} 使用卡片击败BOSS！总能量：${totalEnergy}`)
      this.endBossBattle(true)
      return true
    } else {
      console.log(`❌ ${player.name} 卡片能量不足！总能量：${totalEnergy}，需要：${this._bossBattleState.requirement}`)
      return false
    }
  }
  
  // 处理玩家弃牌回退
  discardCardAndRetreat(player: Player, cardId: number): boolean {
    if (!this._bossBattleState) return false
    
    // 移除选择的卡片
    const success = player.removeCard(cardId)
    if (success) {
      // 找到上一个BOSS位置或起点
      const previousBossPosition = this.findPreviousBossPosition(this._bossBattleState.position)
      
      // 计算剩余步数
      const stepsTaken = this._bossBattleState.position - previousBossPosition
      const remainingSteps = this._bossBattleState.remainingSteps - stepsTaken
      
      // 将玩家移回上一个BOSS位置
      player.position = previousBossPosition
      
      // 继续移动剩余步数
      if (remainingSteps > 0) {
        player.move(remainingSteps)
      }
      
      console.log(`💨 ${player.name} 弃牌撤退，回到位置${previousBossPosition}`)
      this.endBossBattle(false)
      return true
    }
    
    return false
  }
  
  // 计算所选卡片的能量总和
  private calculateCardsEnergy(player: Player, cardIds: number[]): number {
    let totalEnergy = 0
    
    for (const cardId of cardIds) {
      const card = player.getCard(cardId)
      if (card && card.type === 'energy') {
        totalEnergy += card.value
      }
    }
    
    return totalEnergy
  }
  
  // 移除玩家选择的卡片
  private removeSelectedCards(player: Player, cardIds: number[]): void {
    for (const cardId of cardIds) {
      player.removeCard(cardId)
    }
  }
  
  // 结束BOSS战斗
  private endBossBattle(success: boolean): void {
    this._bossBattleState = null
    
    if (success) {
      // BOSS战斗成功，继续游戏
      this.nextTurn()
    }
    // 失败的情况已经在discardCardAndRetreat中处理了移动逻辑
  }
  
  // 找到上一个BOSS位置
  private findPreviousBossPosition(currentPosition: number): number {
    const bossPositions = this._gameBoard.tiles
      .filter(tile => tile.type === 'boss')
      .map(tile => tile.position)
      .sort((a, b) => a - b)
    
    // 找到当前BOSS之前的所有BOSS位置
    const previousBosses = bossPositions.filter(pos => pos < currentPosition)
    
    // 返回最后一个BOSS位置，如果没有则返回起点(0)
    return previousBosses.length > 0 ? previousBosses[previousBosses.length - 1] : 0
  }

  // 切换到下一个回合
  nextTurn(): void {
    this._currentPlayerIndex = (this._currentPlayerIndex + 1) % this._players.length
  }
  // 结束游戏
  private endGame(winner: Player): void {
    this._gameOver = true
    this._winner = winner
  }

   // 重新开始游戏
   restart(): void {
     this._players = []
     this._currentPlayerIndex = 0
     this._gameStarted = false
     this._gameOver = false
     this._winner = null
     this._cardDeck = new CardDeck()
     this._gameBoard = new GameBoard()
     this._bossBattleState = null
   }

   // 序列化方法（用于React状态管理）
   toJSON(): GameState {
     return {
       players: this._players.map(player => player.toJSON()),
       currentPlayerIndex: this._currentPlayerIndex,
       gameStarted: this._gameStarted,
       gameOver: this._gameOver,
       winner: this._winner ? this._winner.toJSON() : null,
       bossBattle: this._bossBattleState ? {
         position: this._bossBattleState.position,
         requirement: this._bossBattleState.requirement,
         originalPosition: this._bossBattleState.originalPosition,
         remainingSteps: this._bossBattleState.remainingSteps
       } : undefined
     }
   }

   // 从数据对象创建Game实例
   static fromData(data: GameState): Game {
     const game = new Game()
     
     if (data.gameStarted) {
       game._players = data.players.map(playerData => Player.fromData(playerData))
       game._currentPlayerIndex = data.currentPlayerIndex
       game._gameStarted = data.gameStarted
       game._gameOver = data.gameOver
       game._winner = data.winner ? Player.fromData(data.winner) : null
       
       // 恢复BOSS战斗状态
       if (data.bossBattle) {
         game._bossBattleState = {
           position: data.bossBattle.position,
           requirement: data.bossBattle.requirement,
           originalPosition: data.bossBattle.originalPosition,
           remainingSteps: data.bossBattle.remainingSteps,
           selectedCards: []
         }
       }
     }
     
     return game
   }
}