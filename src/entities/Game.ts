import {
  Player,
  PlayerData,
  DestinyPlayer,
  SisterFourPlayer,
  PigsyPlayer,
  BigBirdPlayer,
  ThiefPlayer,
  MilkshakePlayer,
  PlayerRole,
} from "./Player";
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

export class Game {
  private _players: Player[];
  private _currentPlayerIndex: number;
  private _gameStarted: boolean;
  private _gameOver: boolean;
  private _winner: Player | null;
  private _cardDeck: CardDeck;
  private _gameBoard: GameBoard;
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

  // 骰子投掷次数跟踪，每个玩家每回合的投掷次数
  private _diceRollCount: Map<number, number> = new Map();

  // 获取当前玩家的骰子投掷次数
  getDiceRollCount(): number {
    const playerId = this.getCurrentPlayer().id;
    return this._diceRollCount.get(playerId) || 0;
  }

  // 增加当前玩家的骰子投掷次数
  incrementDiceRollCount(): void {
    const playerId = this.getCurrentPlayer().id;
    const currentCount = this._diceRollCount.get(playerId) || 0;
    this._diceRollCount.set(playerId, currentCount + 1);
  }

  // 重置当前玩家的骰子投掷次数
  resetDiceRollCount(): void {
    const playerId = this.getCurrentPlayer().id;
    this._diceRollCount.set(playerId, 0);
  }

  // 增加当前玩家的骰子投掷次数（用于额外回合法术）
  addDiceRollCount(additionalRolls: number = 1): void {
    const playerId = this.getCurrentPlayer().id;
    const currentCount = this._diceRollCount.get(playerId) || 0;
    this._diceRollCount.set(playerId, currentCount + additionalRolls);
  }

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
      "destiny",
      "sister_four",
      "pigsy",
      "big_bird",
      "thief",
      "milkshake",
    ];
    for (let i = 0; i < playerCount; i++) {
      const startingCards = this._cardDeck.draw(4);
      let player: Player;
      const thisRole = roles[i] ?? "destiny";
      switch (thisRole) {
        case "destiny":
          player = new DestinyPlayer(
            i + 1,
            `天命人`,
            "destiny",
            0,
            startingCards
          );
          break;
        case "sister_four":
          player = new SisterFourPlayer(
            i + 1,
            `四妹`,
            "sister_four",
            0,
            startingCards
          );
          break;
        case "pigsy":
          player = new PigsyPlayer(i + 1, `猪八戒`, "pigsy", 0, startingCards);
          break;
        case "big_bird":
          player = new BigBirdPlayer(
            i + 1,
            `大鸟姐姐`,
            "big_bird",
            0,
            startingCards
          );
          break;
        case "thief":
          player = new ThiefPlayer(
            i + 1,
            `神偷大盗`,
            "thief",
            0,
            startingCards
          );
          break;
        case "milkshake":
          player = new MilkshakePlayer(
            i + 1,
            `奶昔大哥`,
            "milkshake",
            0,
            startingCards
          );
          break;
        default:
          player = new DestinyPlayer(
            i + 1,
            `天命人`,
            "destiny",
            0,
            startingCards
          );
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
        if (player.direction !== "forward") {
          player.direction = "forward";
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
    const fn =
      mode === "pass" ? roleTileHandler?.onPass : roleTileHandler?.onStay;
    if (fn) {
      await fn(this, player, tile);
    } else {
      await (mode === "pass"
        ? tile.onPass(this, player)
        : tile.onStay(this, player));
    }
  }

  public addMoveSteps(count: number): void {
    this._moveSteps.push(count);
  }

  // 切换到下一个回合
  nextTurn(): void {
    // 重置当前玩家的骰子投掷次数
    this.resetDiceRollCount();
    // 清除当前回合的额外回合状态
    this._activeSpells.extraTurn = false;
    // 切换到下一个玩家
    this._currentPlayerIndex =
      (this._currentPlayerIndex + 1) % this._players.length;
  }
  // 结束游戏
  endGame(winner: Player): void {
    this._gameOver = true;
    this._winner = winner;
    // 通过事件系统通知游戏结束
    this.eventSystem.publishEvent({
      type: "GAME_OVER",
      playerId: winner.id,
    });
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

    // 重置法术状态
    this._activeSpells = {};
    this._activeSpellPending = { card: null, playerId: null };

    // 重置骰子投掷次数跟踪
    this._diceRollCount.clear();

    // 重置移动步骤
    this._moveSteps = [];

    // 重置事件系统
    this._eventSystem.clearEvents();
  }

  // 序列化方法（用于React状态管理）
  toJSON(): GameState {
    return {
      players: this._players.map((player) => player.toJSON()),
      currentPlayerIndex: this._currentPlayerIndex,
      gameStarted: this._gameStarted,
      gameOver: this._gameOver,
      winner: this._winner ? this._winner.toJSON() : null,
      // BOSS战斗状态已移至事件系统处理
    };
  }

  // 处理骰子结果
  processDiceRoll(result: DiceResult): void {
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
        // 允许玩家在当前回合多扔一次骰子
        this.addDiceRollCount();
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
