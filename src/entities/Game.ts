import { Player, PlayerData, DestinyPlayer, SisterFourPlayer, PigsyPlayer, BigBirdPlayer, ThiefPlayer, MilkshakePlayer, PlayerRole } from "./Player";
import { CardDeck } from "./CardDeck";
import { GameBoard } from "./GameBoard";
import { BaseTile } from "./Tile";
import { GameEventSystem } from "./GameEventSystem";

// 游戏状态接口
export interface GameState {
  players: PlayerData[];
  currentPlayerIndex: number;
  gameStarted: boolean;
  gameOver: boolean;
  winner: PlayerData | null;
  bossBattle?: {
    position: number;
    requirement: number;
    originalPosition: number;
    remainingSteps: number;
  };
  activeSpells?: {
    fixedDice?: number;
    extraTurn?: boolean;
    swapTarget?: number;
    spellShield?: number;
  };
}

// 骰子结果接口
export interface DiceResult {
  dice1: number;
  dice2: number;
  total: number;
}

// BOSS战斗状态接口
interface BossBattleState {
  position: number; // BOSS位置
  requirement: number; // 所需能量
  originalPosition: number; // 玩家原始位置
  remainingSteps: number; // 剩余步数
  selectedCards: number[]; // 已选择的卡片ID
}

export class Game {
  private _players: Player[];
  private _currentPlayerIndex: number;
  private _gameStarted: boolean;
  private _gameOver: boolean;
  private _winner: Player | null;
  private _cardDeck: CardDeck;
  private _gameBoard: GameBoard;
  private _bossBattleState: BossBattleState | null = null;
  private _activeSpells: {
    fixedDice?: number;
    extraTurn?: boolean;
    swapTarget?: number;
    spellShield?: number;
  } = {};
  private _activeSpellPending: {
    card: any | null;
    playerId: number | null;
    options?: any;
  } = { card: null, playerId: null };
  
  // 事件系统
  private _eventSystem: GameEventSystem;
  
  /**
   * 剩余行动步骤数组，未空行动即结束
   */
  private _moveSteps: number[] = [];

  constructor() {
    this._players = [];
    this._currentPlayerIndex = 0;
    this._gameStarted = false;
    this._gameOver = false;
    this._winner = null;
    this._cardDeck = new CardDeck();
    this._gameBoard = new GameBoard();
    this._eventSystem = new GameEventSystem();
  }

  // Getters
  get players(): Player[] {
    return [...this._players];
  }
  get currentPlayerIndex(): number {
    return this._currentPlayerIndex;
  }
  get gameStarted(): boolean {
    return this._gameStarted;
  }
  get gameOver(): boolean {
    return this._gameOver;
  }
  get winner(): Player | null {
    return this._winner;
  }
  get cardDeck(): CardDeck {
    return this._cardDeck;
  }
  get gameBoard(): GameBoard {
    return this._gameBoard;
  }
  get bossBattleState(): BossBattleState | null {
    return this._bossBattleState;
  }
  get activeSpellPending() {
    return this._activeSpellPending;
  }
  get eventSystem() {
    return this._eventSystem;
  }

  // 初始化游戏
  initialize(playerCount: number): void {
    if (playerCount < 2 || playerCount > 6) {
      throw new Error("玩家数量必须在2-6人之间");
    }

    // 重置游戏状态
    this._players = [];
    this._currentPlayerIndex = 0;
    this._gameStarted = true;
    this._gameOver = false;
    this._winner = null;

    // 创建牌堆
    this._cardDeck = CardDeck.createStandardDeck();

    // 创建玩家并分配起始手牌
    const roles: PlayerRole[] = [
      'destiny','sister_four','pigsy','big_bird','thief','milkshake'];
    for (let i = 0; i < playerCount; i++) {
      const startingCards = this._cardDeck.draw(4);
      let player: Player;
      const thisRole = roles[i] ?? 'destiny';
      switch (thisRole) {
        case 'destiny': player = new DestinyPlayer(i+1, `天命人`, 'destiny', 0, startingCards); break;
        case 'sister_four': player = new SisterFourPlayer(i+1, `四妹`, 'sister_four', 0, startingCards); break;
        case 'pigsy': player = new PigsyPlayer(i+1, `猪八戒`, 'pigsy', 0, startingCards); break;
        case 'big_bird': player = new BigBirdPlayer(i+1, `大鸟姐姐`, 'big_bird', 0, startingCards); break;
        case 'thief': player = new ThiefPlayer(i+1, `神偷大盗`, 'thief', 0, startingCards); break;
        case 'milkshake': player = new MilkshakePlayer(i+1, `奶昔大哥`, 'milkshake', 0, startingCards); break;
        default: player = new DestinyPlayer(i+1, `天命人`, 'destiny', 0, startingCards);
      }
      this._players.push(player);
    }

    // 生成游戏地图
    this._gameBoard.generateStandardBoard();
  }

  // 获取当前玩家
  getCurrentPlayer(): Player {
    if (!this._gameStarted || this._players.length === 0) {
      throw new Error("游戏未开始或没有玩家");
    }
    return this._players[this._currentPlayerIndex];
  }

  /**
   * 异步推进步数流程
   */
  async processSteps(steps: number): Promise<void> {
    if (!this._gameStarted || this._gameOver)
      throw new Error("游戏未开始或已结束");
    const player = this.getCurrentPlayer();
    this._moveSteps = [steps];
    while (this._moveSteps.length > 0) {
      let currentStep = this._moveSteps.shift()!;
      // 逐格推进
      while (Math.abs(currentStep) > 0) {
        player.move(currentStep > 0 ? 1 : -1);
        const tile = this._gameBoard.getTile(player.position);
        if (!tile) break;
        await this.handleTileEffect(tile, "pass"); // 路过
        if (currentStep > 0) currentStep--;
        else currentStep++;
      }
      const tile = this._gameBoard.getTile(player.position);
      if (tile) {
        // 如果玩家方向不是正向，调整为正向
        if (player.direction !== 'forward') {
          player.direction = 'forward';
        }
        await this.handleTileEffect(tile, "stay"); // 停留
      }
    }
  }

  /**
   * 异步处理单个格子的效果，mode:'pass'|'stay'。实际交互可由具体格子内异步Promise实现。
   */
  private async handleTileEffect(
    tile: BaseTile,
    mode: "pass" | "stay"
  ): Promise<void> {
    const player = this.getCurrentPlayer();
    const handlers = (player as any).getTileHandlers?.();
    const roleTileHandler = handlers?.[tile.type];
    const fn = mode === 'pass' ? roleTileHandler?.onPass : roleTileHandler?.onStay;
    if (fn) {
      await fn(this, player, tile);
    } else {
      await (mode === 'pass' ? tile.onPass(this, player) : tile.onStay(this, player));
    }
  }

  // 供 UI 挂钩，等待异步格子内玩家操作，返回Promise<void>，实际UI可调用resolve
  public waitForPlayerChoice(_tile: BaseTile): Promise<void> {
    // 这里简单实现一个挂起等待的Promise，UI拿到resolve之后实际推进
    return new Promise((_resolve) => {
      // 可存在一个队列或pending标记留给UI
      // 如 this._pendingChoiceResolve = resolve
    });
  }

  public addMoveSteps(count: number): void {
    this._moveSteps.push(count);
  }

  // 切换到下一个回合
  // 处理BOSS战斗
  // 处理BOSS战斗
  private handleBossBattle(
    _player: Player,
    _tile: BaseTile,
    _diceTotal: number
  ): void {}

  // 启动基于卡片的BOSS战斗
  private startCardBasedBossBattle(
    player: Player,
    tile: BaseTile,
    diceTotal: number
  ): void {
    // 设置BOSS战斗状态，等待玩家选择卡片
    this._bossBattleState = {
      position: tile.position,
      requirement: tile.bossRequirement!,
      originalPosition: player.position,
      remainingSteps: diceTotal,
      selectedCards: [],
    };

    console.log(
      `⚔️ ${player.name} 进入BOSS战斗！需要 ${tile.bossRequirement} 点能量`
    );
    console.log(`请选择要使用的卡片组合，或者弃掉一张卡片回到上一关BOSS位置`);
  }

  // 处理玩家出牌
  playCardsForBossBattle(player: Player, cardIds: number[]): boolean {
    if (!this._bossBattleState) return false;

    const totalEnergy = this.calculateCardsEnergy(player, cardIds);

    if (totalEnergy >= this._bossBattleState.requirement) {
      // 成功击败BOSS
      this.removeSelectedCards(player, cardIds);
      console.log(`🎉 ${player.name} 使用卡片击败BOSS！总能量：${totalEnergy}`);
      this.endBossBattle(true);
      return true;
    } else {
      console.log(
        `❌ ${player.name} 卡片能量不足！总能量：${totalEnergy}，需要：${this._bossBattleState.requirement}`
      );
      return false;
    }
  }

  // 处理玩家弃牌回退
  discardCardAndRetreat(player: Player, cardId: number): boolean {
    if (!this._bossBattleState) return false;

    // 移除选择的卡片
    const success = player.removeCard(cardId);
    if (success) {
      // 找到上一个BOSS位置或起点
      const previousBossPosition = this.findPreviousBossPosition(
        this._bossBattleState.position
      );

      // 计算剩余步数
      const stepsTaken = this._bossBattleState.position - previousBossPosition;
      const remainingSteps = this._bossBattleState.remainingSteps - stepsTaken;

      // 将玩家移回上一个BOSS位置
      player.position = previousBossPosition;

      // 继续移动剩余步数
      if (remainingSteps > 0) {
        player.move(remainingSteps);
      }

      console.log(
        `💨 ${player.name} 弃牌撤退，回到位置${previousBossPosition}`
      );
      this.endBossBattle(false);
      return true;
    }

    return false;
  }

  // 计算所选卡片的能量总和
  private calculateCardsEnergy(player: Player, cardIds: number[]): number {
    let totalEnergy = 0;

    for (const cardId of cardIds) {
      const card = player.getCard(cardId);
      if (card && card.type === "energy") {
        totalEnergy += card.value;
      }
    }

    return totalEnergy;
  }

  // 移除玩家选择的卡片
  private removeSelectedCards(player: Player, cardIds: number[]): void {
    for (const cardId of cardIds) {
      player.removeCard(cardId);
    }
  }

  // 结束BOSS战斗
  private endBossBattle(success: boolean): void {
    this._bossBattleState = null;

    if (success) {
      // BOSS战斗成功，继续游戏
    }
    // 失败的情况已经在discardCardAndRetreat中处理了移动逻辑
  }

  // 找到上一个BOSS位置
  private findPreviousBossPosition(currentPosition: number): number {
    const bossPositions = this._gameBoard.tiles
      .filter((tile) => tile.type === "boss")
      .map((tile) => tile.position)
      .sort((a, b) => a - b);

    // 找到当前BOSS之前的所有BOSS位置
    const previousBosses = bossPositions.filter((pos) => pos < currentPosition);

    // 返回最后一个BOSS位置，如果没有则返回起点(0)
    return previousBosses.length > 0
      ? previousBosses[previousBosses.length - 1]
      : 0;
  }

  // 切换到下一个回合
  nextTurn(): void {
    this._currentPlayerIndex =
      (this._currentPlayerIndex + 1) % this._players.length;
  }
  // 结束游戏
  private endGame(winner: Player): void {
    this._gameOver = true;
    this._winner = winner;
  }

  // 重新开始游戏
  restart(): void {
    this._players = [];
    this._currentPlayerIndex = 0;
    this._gameStarted = false;
    this._gameOver = false;
    this._winner = null;
    this._cardDeck = new CardDeck();
    this._gameBoard = new GameBoard();
    this._bossBattleState = null;
  }

  // 序列化方法（用于React状态管理）
  toJSON(): GameState {
    return {
      players: this._players.map((player) => player.toJSON()),
      currentPlayerIndex: this._currentPlayerIndex,
      gameStarted: this._gameStarted,
      gameOver: this._gameOver,
      winner: this._winner ? this._winner.toJSON() : null,
      bossBattle: this._bossBattleState
        ? {
            position: this._bossBattleState.position,
            requirement: this._bossBattleState.requirement,
            originalPosition: this._bossBattleState.originalPosition,
            remainingSteps: this._bossBattleState.remainingSteps,
          }
        : undefined,
    };
  }

  // 处理骰子结果
  processDiceRoll(result: DiceResult): void {
    const player = this.getCurrentPlayer();
    const steps = result.total;
    
    // 检查是否有固定骰子法术激活
    if (this._activeSpells.fixedDice !== undefined) {
      // 使用固定值而不是实际骰子值
      // 注意：这里我们仍然使用实际骰子值，但可以在其他地方使用固定值
      this._activeSpells.fixedDice = undefined; // 重置固定骰子
    }
    
    // 启动步数处理流程
    this.processSteps(steps);
  }

  // 从数据对象创建Game实例
  static fromData(data: GameState): Game {
    const game = new Game();

    if (data.gameStarted) {
      game._players = data.players.map((playerData) =>
        Player.fromData(playerData)
      );
      game._currentPlayerIndex = data.currentPlayerIndex;
      game._gameStarted = data.gameStarted;
      game._gameOver = data.gameOver;
      game._winner = data.winner ? Player.fromData(data.winner) : null;

      // 恢复BOSS战斗状态
      if (data.bossBattle) {
        game._bossBattleState = {
          position: data.bossBattle.position,
          requirement: data.bossBattle.requirement,
          originalPosition: data.bossBattle.originalPosition,
          remainingSteps: data.bossBattle.remainingSteps,
          selectedCards: [],
        };
      }
    }

    return game;
  }

  // 激活法术卡，等待玩家参数或直接执行
  activateSpellCard(player: Player, cardId: number): boolean {
    const card = player.getCard(cardId);
    if (!card || card.type !== "spell") return false;
    // 判断是否需要参数
    if (card.effect === "fix_dice" || card.effect === "swap_position") {
      // 等待后续 UI 提供参数
      this._activeSpellPending = { card, playerId: player.id, options: {} };
      return true;
    }
    // 如无需参数可直接调用 playSpellCard
    return this.playSpellCard(player, cardId, {});
  }

  // 使用法术卡，执行具体效果（如被动型可直接用此; 需参数的由 UI 收集参数后再回调此函数）
  playSpellCard(player: Player, cardId: number, options?: any): boolean {
    const card = player.getCard(cardId);
    if (!card || card.type !== "spell") return false;
    // 每次执行时清空激活态
    this._activeSpellPending = { card: null, playerId: null };
    switch (card.effect) {
      case "fix_dice": {
        if (!options || typeof options.fixedValue !== "number") return false;
        this._activeSpells.fixedDice = options.fixedValue;
        player.removeCard(cardId);
        // TODO this.processDiceRoll()
        return true;
      }
      case "extra_turn": {
        this._activeSpells.extraTurn = true;
        player.removeCard(cardId);
        return true;
      }
      case "swap_position": {
        if (!options || typeof options.targetPlayerId !== "number")
          return false;
        const target = this._players.find(
          (p) => p.id === options.targetPlayerId
        );
        if (!target) return false;
        const tmp = player.position;
        player.position = target.position;
        target.position = tmp;
        player.removeCard(cardId);
        return true;
      }
      case "spell_shield": {
        this._activeSpells.spellShield = player.id;
        player.removeCard(cardId);
        return true;
      }
      default:
        return false;
    }
  }
}
