import { Game } from "./Game";
import { Card, Direction, Player, PlayerRole } from "./Player";
import { BaseTile } from "./Tile";

/**
 * AI玩家游戏状态接口
 */
export interface AIPlayerGameState {
  isLeading: boolean;
  leadDistance: number;
  tilesToEnd: number;
  urgency: "low" | "medium" | "high";
  cardAdvantage: number;
  closestOpponent: Player;
}

/**
 * AI决策类型
 */
export type AIDecisionType =
  | "roll_dice" // 掷骰子
  | "use_spell_card" // 使用法术卡
  | "end_turn" // 结束回合
  | "select_player" // 选择玩家
  | "select_cards" // 选择卡牌
  | "select_dice_value" // 选择骰子点数
  | "select_tile" // 选择格子
  | "SHOULD_ROLL_DICE" // 是否应该掷骰子
  | "SELECT_SPELL_CARD" // 选择法术卡
  | "SELECT_TILE" // 选择格子
  | "SELECT_PLAYER" // 选择玩家
  | "SELECT_CARD" // 选择卡牌
  | "SELECT_DICE_VALUE" // 选择骰子点数
  | "USE_SPELL_CARD" // 使用法术卡
  | "SELECT_CARDS"; // 选择多张卡牌

/**
 * AI决策结果接口
 */
export interface AIDecisionResult<T = any> {
  type: AIDecisionType;
  data: T;
  confidence?: number; // 决策的置信度 (0-1)
  reasoning?: string; // 决策理由
}

/**
 * AI玩家类，继承自Player
 */
export class AIPlayer extends Player {
  public readonly isAI: boolean = true;
  private _decisionSystem: AIDecisionSystem;

  constructor(
    id: number,
    name: string,
    role: PlayerRole = "destiny",
    position: number = 0,
    cards: Card[] = [],
    direction: Direction = "forward",
  ) {
    super(id, name, role, position, cards, direction);
    this._decisionSystem = new AIDecisionSystem();
  }

  /**
   * AI决策方法，根据游戏状态做出决策
   * @param decisionType 决策类型
   * @param game 游戏实例
   * @param _player 玩家实例
   * @param context 决策上下文
   * @param priority 决策优先级（可选）
   * @returns 决策结果
   */
  async makeDecision<T = any>(
    decisionType: AIDecisionType,
    game: Game,
    _player: Player,
    context?: any,
    priority?: "low" | "medium" | "high",
  ): Promise<AIDecisionResult<T>> {
    // 增强决策上下文，添加优先级信息
    const enhancedContext = {
      ...context,
      priority: priority || "medium",
      playerState: {
        position: this.position,
        cards: this.cards,
        role: this.role,
        direction: this.direction,
      },
    };

    return this._decisionSystem.makeDecision(
      game,
      this,
      decisionType,
      enhancedContext,
    );
  }
}

/**
 * AI决策系统类
 */
export class AIDecisionSystem {
  private _strategyWeights: Map<string, number> = new Map();

  constructor() {
    // 初始化策略权重
    this._strategyWeights.set("aggressive", 0.3);
    this._strategyWeights.set("defensive", 0.3);
    this._strategyWeights.set("balanced", 0.4);
  }

  /**
   * 根据游戏状态和决策类型做出决策
   * @param game 游戏实例
   * @param player AI玩家实例
   * @param decisionType 决策类型
   * @param context 决策上下文
   * @returns 决策结果
   */
  async makeDecision<T = any>(
    game: Game,
    player: AIPlayer,
    decisionType: AIDecisionType,
    context?: any,
  ): Promise<AIDecisionResult<T>> {
    // 分析游戏状态
    const gameState = this.analyzeGameState(game, player);

    // 根据游戏状态调整策略
    this.adjustStrategy(gameState);

    switch (decisionType) {
      case "roll_dice":
      case "SHOULD_ROLL_DICE":
        return this.shouldRollDice(
          game,
          player,
          gameState,
        ) as AIDecisionResult<T>;
      case "use_spell_card":
      case "USE_SPELL_CARD":
        return this.selectSpellCard(
          game,
          player,
          context,
        ) as AIDecisionResult<T>;
      case "end_turn":
        return { type: "end_turn", data: {} } as AIDecisionResult<T>;
      case "select_player":
      case "SELECT_PLAYER":
        return this.selectPlayer(game, player, context) as AIDecisionResult<T>;
      case "select_cards":
      case "SELECT_CARDS":
        return this.selectCards(
          game,
          player,
          context,
          gameState,
        ) as AIDecisionResult<T>;
      case "select_dice_value":
      case "SELECT_DICE_VALUE":
        return this.selectDiceValue(
          game,
          player,
          context,
          gameState,
        ) as AIDecisionResult<T>;
      case "select_tile":
      case "SELECT_TILE":
        return this.selectTile(
          game,
          player,
          context,
          gameState,
        ) as AIDecisionResult<T>;
      default:
        throw new Error(`未知的决策类型: ${decisionType}`);
    }
  }

  /**
   * 分析游戏状态
   * @param game 游戏实例
   * @param player AI玩家
   * @returns 游戏状态分析结果
   */
  private analyzeGameState(game: Game, player: AIPlayer): AIPlayerGameState {
    // 计算到终点的距离
    const tilesToEnd = game.gameBoard.tiles.length - player.position;

    // 计算领先程度（相对于最接近的对手）
    const otherPlayers = game.players.filter((p) => p.id !== player.id);
    const closestOpponent = otherPlayers.reduce(
      (closest, current) =>
        current.position > closest.position ? current : closest,
      otherPlayers[0],
    );
    const leadDistance = player.position - closestOpponent.position;

    // 判断是否领先
    const isLeading = leadDistance > 0;

    // 计算游戏紧急度
    let urgency: "low" | "medium" | "high" = "low";
    if (tilesToEnd <= 10) {
      urgency = "high";
    } else if (tilesToEnd <= 20) {
      urgency = "medium";
    }

    // 评估卡牌优势
    const spellCards = player.cards.filter((card) => card.type === "spell");
    const energyCards = player.cards.filter((card) => card.type === "energy");
    const cardAdvantage = spellCards.length + energyCards.length * 0.5;

    return {
      isLeading,
      leadDistance,
      tilesToEnd,
      urgency,
      cardAdvantage,
      closestOpponent,
    };
  }

  /**
   * 根据游戏状态调整策略
   * @param gameState 游戏状态
   */
  private adjustStrategy(gameState: AIPlayerGameState): void {
    if (gameState.urgency === "high") {
      // 高紧急度：增加激进策略权重
      this._strategyWeights.set("aggressive", 0.6);
      this._strategyWeights.set("defensive", 0.1);
      this._strategyWeights.set("balanced", 0.3);
    } else if (gameState.isLeading) {
      // 领先时：增加防御策略权重
      this._strategyWeights.set("aggressive", 0.2);
      this._strategyWeights.set("defensive", 0.5);
      this._strategyWeights.set("balanced", 0.3);
    } else {
      // 默认平衡策略
      this._strategyWeights.set("aggressive", 0.3);
      this._strategyWeights.set("defensive", 0.3);
      this._strategyWeights.set("balanced", 0.4);
    }
  }

  /**
   * 获取当前策略
   */
  private getCurrentStrategy(): string {
    const random = Math.random();
    let cumulative = 0;

    for (const [strategy, weight] of this._strategyWeights) {
      cumulative += weight;
      if (random <= cumulative) {
        return strategy;
      }
    }

    return "balanced";
  }

  /**
   * 决定是否掷骰子
   * @param game 游戏实例
   * @param _player AI玩家
   * @param _gameState 游戏状态
   * @returns 决策结果
   */
  private shouldRollDice(
    game: Game,
    _player: AIPlayer,
    _gameState: AIPlayerGameState,
  ): AIDecisionResult<boolean> {
    // 如果不能掷骰子，返回false
    if (!game.canRollDice()) {
      return {
        type: "roll_dice",
        data: false,
        confidence: 1.0,
        reasoning: "无法掷骰子",
      };
    }

    // 简单策略：如果能掷骰子就掷
    // 未来可以加入更复杂的策略，比如考虑是否有更好的法术卡可以使用
    return {
      type: "roll_dice",
      data: true,
      confidence: 0.8,
      reasoning: "可以掷骰子，选择掷骰子移动",
    };
  }

  /**
   * 选择法术卡
   * @param _game 游戏实例
   * @param player AI玩家
   * @param _context 上下文
   * @returns 决策结果
   */
  private selectSpellCard(
    _game: Game,
    player: AIPlayer,
    _context: { description: string },
  ): AIDecisionResult<Card | null> {
    // 获取所有法术卡
    const spellCards = player.cards.filter((card) => card.type === "spell");

    // 如果没有法术卡，返回null
    if (spellCards.length === 0) {
      return {
        type: "use_spell_card",
        data: null,
        confidence: 1.0,
        reasoning: "没有可用的法术卡",
      };
    }

    // 根据游戏状态调整策略
    const strategy = this.getCurrentStrategy();
    let selectedCard: Card;

    if (strategy === "aggressive") {
      // 激进策略时，优先选择攻击性法术卡
      const attackCards = spellCards.filter(
        (card) =>
          card.effect === "swap_position" || card.effect === "spell_shield",
      );
      selectedCard =
        attackCards.length > 0
          ? attackCards.reduce((prev, current) =>
              prev.value > current.value ? prev : current,
            )
          : spellCards.reduce((prev, current) =>
              prev.value > current.value ? prev : current,
            );
    } else {
      // 默认选择价值最高的法术卡
      selectedCard = spellCards.reduce((prev, current) =>
        prev.value > current.value ? prev : current,
      );
    }

    return {
      type: "use_spell_card",
      data: selectedCard,
      confidence: 0.7,
      reasoning: `根据${strategy}策略选择法术卡: ${selectedCard.name}`,
    };
  }

  /**
   * 选择玩家（用于交换位置等操作）
   * @param game 游戏实例
   * @param player AI玩家
   * @param context 上下文，包含可选玩家列表
   * @returns 决策结果
   */
  private selectPlayer(
    game: Game,
    player: AIPlayer,
    context: { availablePlayers?: Player[]; description: string },
  ): AIDecisionResult<string | null> {
    // 使用game.players而不是context.availablePlayers
    const availablePlayers =
      context?.availablePlayers ||
      game.players.filter((p) => p.id !== player.id);

    // 如果没有可选玩家，返回null
    if (!availablePlayers || availablePlayers.length === 0) {
      return {
        type: "select_player",
        data: null,
        confidence: 1.0,
        reasoning: "没有可选的玩家",
      };
    }

    // 简单策略：选择位置最靠前的玩家（假设位置越靠前越有利）
    // 未来可以加入更复杂的策略，比如根据角色特点选择目标
    const selectedPlayer = availablePlayers.reduce((prev, current) =>
      prev.position > current.position ? prev : current,
    );

    return {
      type: "select_player",
      data: selectedPlayer.id.toString(),
      confidence: 0.6,
      reasoning: `选择位置最靠前的玩家: ${selectedPlayer.name}`,
    };
  }

  /**
   * 选择卡牌（用于出牌等操作）
   * @param _game 游戏实例
   * @param player AI玩家
   * @param context 上下文，包含选择卡牌的要求
   * @param _gameState 游戏状态
   * @returns 决策结果
   */
  private selectCards(
    _game: Game,
    player: AIPlayer,
    context: { minCount?: number; maxCount?: number; description: string },
    _gameState: AIPlayerGameState,
  ): AIDecisionResult<string[]> {
    const { maxCount = player.cards.length } = context;

    // 获取所有可选卡牌
    const availableCards = player.cards;

    // 如果没有可选卡牌，返回空数组
    if (availableCards.length === 0) {
      return {
        type: "select_cards",
        data: [],
        confidence: 1.0,
        reasoning: "没有可选的卡牌",
      };
    }

    // 简单策略：选择价值最高的卡牌，直到达到最大数量
    // 按价值排序卡牌
    const sortedCards = [...availableCards].sort((a, b) => b.value - a.value);

    // 选择前maxCount张卡牌
    const selectedCards = sortedCards.slice(
      0,
      Math.min(maxCount, sortedCards.length),
    );
    const selectedCardIds = selectedCards.map((card) => card.id.toString());

    return {
      type: "select_cards",
      data: selectedCardIds,
      confidence: 0.7,
      reasoning: `选择价值最高的${selectedCardIds.length}张卡牌`,
    };
  }

  /**
   * 选择骰子点数（用于定身术等）
   * @param _game 游戏实例
   * @param _player AI玩家
   * @param context 上下文，包含可选的点数范围
   * @param gameState 游戏状态
   * @returns 决策结果
   */
  private selectDiceValue(
    _game: Game,
    _player: AIPlayer,
    context: { min?: number; max?: number; description: string },
    gameState: AIPlayerGameState,
  ): AIDecisionResult<number> {
    const { min = 1, max = 6 } = context;

    // 策略：根据游戏状态选择点数
    // 如果领先，选择较小的点数保持稳定
    // 如果落后，选择较大的点数追赶
    const selectedValue = gameState.isLeading ? min : max;

    return {
      type: "select_dice_value",
      data: selectedValue,
      confidence: 0.8,
      reasoning: gameState.isLeading
        ? `领先状态，选择最小值 ${selectedValue} 保持稳定`
        : `落后状态，选择最大值 ${selectedValue} 追赶`,
    };
  }

  /**
   * 选择格子（用于传送等操作）
   * @param _game 游戏实例
   * @param _player AI玩家
   * @param context 上下文，包含可选格子列表
   * @param _gameState 游戏状态
   * @returns 决策结果
   */
  private selectTile(
    _game: Game,
    _player: AIPlayer,
    context: { availableTiles: BaseTile[]; description: string },
    _gameState: AIPlayerGameState,
  ): AIDecisionResult<number | null> {
    const { availableTiles } = context;

    if (!availableTiles || availableTiles.length === 0) {
      return {
        type: "select_tile",
        data: null,
        confidence: 1.0,
        reasoning: "没有可选的格子",
      };
    }

    // 策略：选择距离终点最近的格子
    const selectedTile = availableTiles.reduce((prev, current) =>
      prev.position > current.position ? prev : current,
    );

    return {
      type: "select_tile",
      data: selectedTile.position,
      confidence: 0.7,
      reasoning: `选择距离终点最近的格子: ${selectedTile.position}`,
    };
  }
}
