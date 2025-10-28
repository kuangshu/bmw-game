import { Player, PlayerData, PlayerRole, createPlayer } from "./Player";
import { CardDeck } from "./CardDeck";
import { GameBoard } from "./GameBoard";
import { BaseTile } from "./Tile";
import { GameEventSystem } from "./GameEventSystem";
import { Dice, DiceResult } from "./Dice";
import { EventCardDeck } from "./EventCardDeck";
import { PLAYER_ROLES, ROLE_INFO, GAME_CONFIG } from "../constants/game";
import { PlayerRoleSelectionPayload } from "../components/GameEventLayer/PlayerRoleSelectionEvent";

// 游戏状态接口
export interface GameState {
  players: PlayerData[];
  currentPlayerIndex: number;
  gameStarted: boolean;
  gameOver: boolean;
  winner: PlayerData | null;
}

export class Game {
  private _players: Player[];
  private _currentPlayerIndex: number;
  private _gameStarted: boolean;
  private _gameOver: boolean;
  private _winner: Player | null;
  private _cardDeck: CardDeck;
  private _eventCardDeck: EventCardDeck;
  private _gameBoard: GameBoard;
  private _dice: Dice;

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
    this._eventCardDeck = new EventCardDeck();
    this._gameBoard = new GameBoard();
    this._dice = new Dice();
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
  get eventCardDeck(): EventCardDeck {
    return this._eventCardDeck;
  }
  get gameBoard(): GameBoard {
    return this._gameBoard;
  }
  get eventSystem() {
    return this._eventSystem;
  }
  get dice(): Dice {
    return this._dice;
  }

  // 获取当前玩家的骰子投掷次数
  getDiceRollCount(): number {
    return this._dice.rollCount;
  }

  // 增加当前玩家的骰子投掷次数
  incrementDiceRollCount(): void {
    this._dice.incrementRollCount();
  }

  // 获取当前玩家的最大投掷次数
  getMaxDiceRolls(): number {
    return this._dice.maxRolls;
  }

  // 设置当前玩家的最大投掷次数
  setMaxDiceRolls(maxRolls: number): void {
    this._dice.setMaxRolls(maxRolls);
  }

  // 重置当前玩家的骰子投掷次数
  resetDiceRollCount(): void {
    this._dice.resetRollCount();
  }

  // 增加当前玩家的骰子投掷次数（用于额外回合法术）
  addDiceRollCount(additionalRolls: number = 1): void {
    this._dice.setMaxRolls(this._dice.maxRolls + additionalRolls);
  }

  // 判断当前玩家是否可以投掷骰子
  canRollDice(): boolean {
    return this._dice.canRoll();
  }

  // 摇骰子
  rollDice(): Promise<DiceResult> {
    return this._dice.roll();
  }

  // 获取当前骰子结果
  getDiceResult(): DiceResult | null {
    return this._dice.result;
  }

  // 初始化游戏（异步方法，等待玩家选择角色）
  async initialize(playerCount: number): Promise<void> {
    if (
      playerCount < GAME_CONFIG.MIN_PLAYERS ||
      playerCount > GAME_CONFIG.MAX_PLAYERS
    ) {
      throw new Error(
        `玩家数量必须在${GAME_CONFIG.MIN_PLAYERS}-${GAME_CONFIG.MAX_PLAYERS}人之间`,
      );
    }

    // 重置游戏状态
    this._players = [];
    this._currentPlayerIndex = 0;
    this._gameStarted = false; // 先不开始游戏，等待角色选择完成
    this._gameOver = false;
    this._winner = null;
    this._dice.reset();

    // 创建牌堆
    this._cardDeck = CardDeck.createStandardDeck();
    this._eventCardDeck = EventCardDeck.createStandardEventDeck();

    // 所有可用的角色（使用常量）
    const availableRoles: PlayerRole[] = [...PLAYER_ROLES];

    // 一次性发布角色选择事件，让所有玩家依次选择
    const roleSelectionResult = await this._eventSystem.waitForPlayerChoice<
      PlayerRoleSelectionPayload[0],
      PlayerRoleSelectionPayload[1]
    >({
      type: "PLAYER_ROLE_SELECTION",
      playerId: 1, // 使用第一个玩家ID，因为组件会处理所有玩家的选择
      eventData: {
        playerNumber: 1,
        availableRoles: [...availableRoles],
        selectedRoles: [],
        totalPlayers: playerCount,
      },
    });

    // 获取所有玩家选择的角色
    const allSelectedRoles: PlayerRole[] = roleSelectionResult.selectedRoles;

    // 为每个玩家创建角色
    for (let i = 0; i < playerCount; i++) {
      const selectedRole = allSelectedRoles[i];

      // 创建玩家并分配起始手牌
      const startingCards = this._cardDeck.draw(GAME_CONFIG.STARTING_CARDS);

      // 使用角色工厂函数创建玩家
      const playerName = ROLE_INFO[selectedRole]?.name || `玩家${i + 1}`;
      const player = createPlayer(
        i + 1,
        playerName,
        selectedRole,
        0,
        startingCards,
      );

      this._players.push(player);
    }

    // 生成游戏地图
    this._gameBoard.generateStandardBoard();

    // 所有玩家选择完成后，开始游戏
    this._gameStarted = true;
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer(): Player {
    if (!this._gameStarted || this._players.length === 0) {
      throw new Error("游戏未开始或没有玩家");
    }
    return this._players[this._currentPlayerIndex];
  }

  /**
   * 根据玩家ID获取玩家对象
   */
  getPlayer(playerId: number): Player {
    const player = this._players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error(`找不到ID为${playerId}的玩家`);
    }
    return player;
  }

  /**
   * 异步推进步数流程
   */
  async processSteps(steps: number): Promise<void> {
    if (!this._gameStarted || this._gameOver)
      throw new Error("游戏未开始或已结束");
    const player = this.getCurrentPlayer();

    // 根据玩家方向确定steps的正负
    const effectiveSteps = player.direction === "forward" ? steps : -steps;

    this._moveSteps = [effectiveSteps];
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
        await this.handleTileEffect(tile, "stay"); // 停留
      }

      if (player.direction !== "forward") {
        player.direction = "forward";
      }
    }
  }

  /**
   * 异步处理单个格子的效果，mode:'pass'|'stay'。实际交互可由具体格子内异步Promise实现。
   */
  private async handleTileEffect(
    tile: BaseTile,
    mode: "pass" | "stay",
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

  /**
   * 添加移动步数（用于处理定身术等效果）
   */
  public addMoveSteps(count: number): void {
    this._moveSteps.push(count);
  }

  /**
   * 交换两个玩家的位置
   */
  public swapPosition(playerId1: number, playerId2: number): boolean {
    const player1 = this._players.find((p) => p.id === playerId1);
    const player2 = this._players.find((p) => p.id === playerId2);

    if (!player1 || !player2) {
      return false;
    }

    // 交换位置
    const tempPosition = player1.position;
    player1.position = player2.position;
    player2.position = tempPosition;

    return true;
  }

  // 切换到下一个回合
  nextTurn(): void {
    // 重置当前玩家的骰子投掷次数
    this.resetDiceRollCount();
    // 重置最大投掷次数为默认值1
    this._dice.setMaxRolls(1);
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
    this._dice.reset();

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
    };
  }

  // 处理骰子结果
  async processDiceRoll(result: DiceResult): Promise<void> {
    const steps = result.total;

    // 启动步数处理流程
    await this.processSteps(steps);
  }

  // 从数据对象创建Game实例
  static fromData(data: GameState): Game {
    const game = new Game();

    if (data.gameStarted) {
      game._players = data.players.map((playerData) =>
        Player.fromData(playerData),
      );
      game._currentPlayerIndex = data.currentPlayerIndex;
      game._gameStarted = data.gameStarted;
      game._gameOver = data.gameOver;
      game._winner = data.winner ? Player.fromData(data.winner) : null;
    }

    return game;
  }

  /**
   * 从玩家手中弃掉指定的卡牌，并根据卡牌类型决定去向：
   * 事件卡回到事件卡堆，功能卡回到弃牌堆
   * @param player 玩家对象
   * @param cardIds 要弃掉的卡牌ID数组
   */
  discardCards(player: Player, cardIds: number[]): void {
    // 找到要弃掉的卡牌
    const cardsToDiscard = player.cards.filter((card) =>
      cardIds.includes(card.id),
    );

    // 从玩家手中移除这些卡牌
    cardsToDiscard.forEach((card) => {
      player.removeCard(card.id);
    });

    // 根据卡牌类型分类处理
    const eventCards = cardsToDiscard.filter((card) => card.type === "event");
    const functionalCards = cardsToDiscard.filter(
      (card) => card.type !== "event",
    );

    // 事件卡回到事件卡堆
    if (eventCards.length > 0) {
      this._eventCardDeck.returnEventCards(eventCards.map((card) => card.id));
      console.log(`📤 ${eventCards.length} 张事件卡已返回事件卡堆`);
    }

    // 功能卡回到弃牌堆
    if (functionalCards.length > 0) {
      this._cardDeck.discard(functionalCards);
      console.log(`📥 ${functionalCards.length} 张功能卡已放入弃牌堆`);
    }

    console.log(`玩家 ${player.id} 弃掉了 ${cardsToDiscard.length} 张卡牌`);
  }

  /**
   * 为玩家抽取指定数量的卡牌
   * @param player 玩家对象
   * @param count 要抽取的卡牌数量
   */
  drawCards(player: Player, count: number): void {
    if (count <= 0) {
      console.warn(
        `无法为玩家 ${player.id} 抽取 ${count} 张卡牌，数量必须大于0`,
      );
      return;
    }

    try {
      // 从卡牌堆中抽取指定数量的卡牌
      const drawnCards = this._cardDeck.draw(count);

      // 将抽到的卡牌添加到玩家手牌中
      drawnCards.forEach((card) => {
        player.addCard(card);
      });

      console.log(`玩家 ${player.id} 抽取了 ${drawnCards.length} 张卡牌`);
    } catch (error) {
      console.error(`为玩家 ${player.id} 抽取卡牌时出错:`, error);
    }
  }
}
