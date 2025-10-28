import type { Game } from "./Game";
import type { Player, Card } from "./Player";
import type { PlayerSelectionPayload } from "../components/GameEventLayer/PlayerSelectionUI";
import type { CardSelectionPayload } from "../components/GameEventLayer/CardSelectionUI.tsx";
import type { DiceResult } from "./Dice";

// 掷骰子事件数据类型
export type DiceRollPayload = [
  {
    player: {
      id: number;
      name: string;
    };
    description?: string;
  },
  { diceResult: DiceResult },
];

/**
 * 事件卡牌类型定义
 */
export type EventCardType =
  | "swap_all_cards" // 1. 可与场上任一玩家互换所有卡牌
  | "boss_battle_pass" // 2. 下一关BOSS的PK直接通关（玩家可保留此卡）
  | "random_discard" // 3. 你随机舍弃一张卡牌
  | "next_player_discard" // 4. 你与下一位玩家随机舍弃一张卡牌
  | "all_players_draw" // 5. 每位玩家从功能卡堆中抽取一张卡牌
  | "prev_player_draw" // 6. 你与上一位玩家从功能卡堆中抽取一张卡牌
  | "all_players_discard" // 7. 每位玩家随机舍弃一张卡牌
  | "dice_battle_steal"; // 8. 选择一位玩家进行扔骰子的PK，如果你获胜可以抽取对方一张卡牌，失败则不抽取

/**
 * 事件卡牌接口
 */
export interface EventCard {
  id: number;
  type: EventCardType;
  name: string;
  description: string;
  keepable: boolean; // 是否可以被玩家保留

  /**
   * 执行事件效果
   * @param game 游戏实例
   * @param player 触发事件的玩家
   */
  execute(game: Game, player: Player): Promise<void>;

  /**
   * 获取事件的详细信息
   */
  getDetails(): string;
}

/**
 * 事件卡牌基类
 */
export abstract class BaseEventCard implements EventCard {
  id: number;
  type: EventCardType;
  name: string;
  description: string;
  keepable: boolean;

  constructor(
    id: number,
    type: EventCardType,
    name: string,
    description: string,
    keepable: boolean = false,
  ) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = description;
    this.keepable = keepable;
  }

  /**
   * 执行事件效果（抽象方法，由子类实现）
   * @param game 游戏实例
   * @param player 触发事件的玩家
   */
  abstract execute(game: Game, player: Player): Promise<void>;

  /**
   * 获取事件的详细信息
   */
  getDetails(): string {
    return `${this.name}: ${this.description}${this.keepable ? " (可保留)" : ""}`;
  }
}

/**
 * 1. 可与场上任一玩家互换所有卡牌
 */
export class SwapAllCardsEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      "swap_all_cards",
      "命运交换",
      "可与场上任一玩家互换所有卡牌",
      false,
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    console.log(`玩家 ${player.id} 触发了交换玩家手牌事件卡`);

    // 获取除当前玩家外的所有玩家
    const allPlayers = game.players;
    const availablePlayers = allPlayers.filter((p) => p.id !== player.id);

    // 如果没有其他玩家，直接返回
    if (availablePlayers.length === 0) {
      console.log("没有其他玩家可以交换手牌");
      return;
    }

    // 触发玩家选择事件
    const selectionResult = await game.eventSystem.waitForPlayerChoice<
      PlayerSelectionPayload[0],
      PlayerSelectionPayload[1]
    >({
      type: "PLAYER_CHOICE",
      playerId: player.id,
      eventData: {
        currentPlayer: player,
        availablePlayers: availablePlayers,
        description: "选择一位玩家与其交换所有手牌",
        canCancel: true,
      },
    });

    // 获取选择的玩家ID
    const selectedPlayerId = selectionResult.selectedPlayerId;

    // 如果玩家放弃选择，直接返回
    if (selectedPlayerId === null) {
      console.log("玩家放弃交换手牌");
      return;
    }

    // 获取选中的玩家对象
    const selectedPlayer = game.getPlayer(selectedPlayerId);

    // 交换两个玩家的手牌
    const playerCards = [...player.cards];
    const selectedPlayerCards = [...selectedPlayer.cards];

    // 清空两个玩家的手牌
    playerCards.forEach((card) => player.removeCard(card.id));
    selectedPlayerCards.forEach((card) => selectedPlayer.removeCard(card.id));

    // 交换手牌
    playerCards.forEach((card) => selectedPlayer.addCard(card));
    selectedPlayerCards.forEach((card) => player.addCard(card));

    console.log(`玩家 ${player.id} 与玩家 ${selectedPlayerId} 成功交换手牌`);
  }
}

/**
 * 2. 下一关BOSS的PK直接通关（玩家可保留此卡）
 */
export class BossBattlePassEventCard extends BaseEventCard {
  constructor(id: number) {
    super(id, "boss_battle_pass", "BOSS通行证", "下一关BOSS的PK直接通关", true);
  }

  async execute(_game: Game, player: Player): Promise<void> {
    console.log(`玩家 ${player.id} 使用了BOSS通行证事件卡`);

    // 创建一个事件卡对象，type为'event'，value为99
    const eventCard: Card = {
      id: this.id,
      type: "event",
      value: 99,
      name: this.name,
      description: this.description,
    };

    // 将事件卡添加到玩家手牌中
    player.addCard(eventCard);

    console.log(`玩家 ${player.id} 获得了事件卡: ${this.name}`);
  }
}

/**
 * 3. 你随机舍弃一张卡牌
 */
export class RandomDiscardEventCard extends BaseEventCard {
  constructor(id: number) {
    super(id, "random_discard", "失物招领", "你随机舍弃一张卡牌", false);
  }

  async execute(game: Game, player: Player): Promise<void> {
    console.log(`玩家 ${player.id} 使用了随机舍弃一张卡牌事件卡`);

    // 检查玩家是否有卡牌
    if (player.cards.length === 0) {
      console.log("玩家没有卡牌可以舍弃");
      return;
    }

    // 触发玩家选择卡牌事件
    const selectionResult = await game.eventSystem.waitForCardChoice<
      CardSelectionPayload[0],
      CardSelectionPayload[1]
    >({
      type: "CARD_CHOICE",
      playerId: player.id,
      eventData: {
        cards: player.cards,
        isHidden: true,
        minSelection: 1,
        maxSelection: 1,
        title: "舍弃卡牌",
        description: "请选择一张要舍弃的卡牌",
      },
    });

    // 获取选择的卡牌ID
    const selectedCardIds = selectionResult.selectedCardIds;

    // 如果玩家没有选择卡牌（取消操作），直接返回
    if (selectedCardIds.length === 0) {
      console.log("玩家取消了舍弃卡牌操作");
      return;
    }

    // 从玩家手中弃掉选中的卡牌
    game.discardCards(player, selectedCardIds);

    console.log(`玩家 ${player.id} 舍弃了 ${selectedCardIds.length} 张卡牌`);
  }
}

/**
 * 4. 你与下一位玩家随机舍弃一张卡牌
 */
export class NextPlayerDiscardEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      "next_player_discard",
      "连锁反应",
      "你与下一位玩家随机舍弃一张卡牌",
      false,
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    console.log(`玩家 ${player.id} 使用了与下一位玩家随机舍弃一张卡牌事件卡`);

    // 获取下一位玩家
    const nextPlayerIndex =
      (game.players.indexOf(player) + 1) % game.players.length;
    const nextPlayer = game.players[nextPlayerIndex];

    // 检查当前玩家和下一位玩家是否都有卡牌
    if (player.cards.length === 0 && nextPlayer.cards.length === 0) {
      console.log("玩家和下一位玩家都没有卡牌可以舍弃");
      return;
    }

    // 处理当前玩家的卡牌选择
    let currentPlayerSelectedCardIds: number[] = [];
    if (player.cards.length > 0) {
      // 触发当前玩家选择卡牌事件
      const currentPlayerSelectionResult =
        await game.eventSystem.waitForCardChoice<
          CardSelectionPayload[0],
          CardSelectionPayload[1]
        >({
          type: "CARD_CHOICE",
          playerId: player.id,
          eventData: {
            cards: player.cards,
            isHidden: true,
            minSelection: 1,
            maxSelection: 1,
            title: "舍弃卡牌",
            description: "请选择一张要舍弃的卡牌",
          },
        });

      currentPlayerSelectedCardIds =
        currentPlayerSelectionResult.selectedCardIds;

      // 如果当前玩家没有选择卡牌（取消操作），直接返回
      if (currentPlayerSelectedCardIds.length === 0) {
        console.log("当前玩家取消了舍弃卡牌操作");
        return;
      }

      // 从当前玩家手中弃掉选中的卡牌
      game.discardCards(player, currentPlayerSelectedCardIds);
    }

    // 处理下一位玩家的卡牌选择
    let nextPlayerSelectedCardIds: number[] = [];
    if (nextPlayer.cards.length > 0) {
      // 触发下一位玩家选择卡牌事件
      const nextPlayerSelectionResult =
        await game.eventSystem.waitForCardChoice<
          CardSelectionPayload[0],
          CardSelectionPayload[1]
        >({
          type: "CARD_CHOICE",
          playerId: nextPlayer.id,
          eventData: {
            cards: nextPlayer.cards,
            isHidden: true,
            minSelection: 1,
            maxSelection: 1,
            title: "舍弃卡牌",
            description: "请选择一张要舍弃的卡牌",
          },
        });

      nextPlayerSelectedCardIds = nextPlayerSelectionResult.selectedCardIds;

      // 如果下一位玩家没有选择卡牌（取消操作），直接返回
      if (nextPlayerSelectedCardIds.length === 0) {
        console.log("下一位玩家取消了舍弃卡牌操作");
        return;
      }

      // 从下一位玩家手中弃掉选中的卡牌
      game.discardCards(nextPlayer, nextPlayerSelectedCardIds);
    }

    console.log(
      `玩家 ${player.id} 舍弃了 ${currentPlayerSelectedCardIds.length} 张卡牌，下一位玩家 ${nextPlayer.id} 舍弃了 ${nextPlayerSelectedCardIds.length} 张卡牌`,
    );
  }
}

/**
 * 5. 每位玩家从功能卡堆中抽取一张卡牌
 */
export class AllPlayersDrawEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      "all_players_draw",
      "全民福利",
      "每位玩家从功能卡堆中抽取一张卡牌",
      false,
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    console.log(
      `玩家 ${player.id} 使用了每位玩家从功能卡堆中抽取一张卡牌事件卡`,
    );

    // 为每位玩家抽取一张卡牌
    game.players.forEach((p) => {
      game.drawCards(p, 1);
    });

    console.log("所有玩家已抽取卡牌");
  }
}

/**
 * 6. 你与上一位玩家从功能卡堆中抽取一张卡牌
 */
export class PrevPlayerDrawEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      "prev_player_draw",
      "前辈的馈赠",
      "你与上一位玩家从功能卡堆中抽取一张卡牌",
      false,
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    console.log(
      `玩家 ${player.id} 使用了你与上一位玩家从功能卡堆中抽取一张卡牌事件卡`,
    );

    // 获取上一位玩家
    const prevPlayerIndex =
      (game.players.indexOf(player) - 1 + game.players.length) %
      game.players.length;
    const prevPlayer = game.players[prevPlayerIndex];

    // 为当前玩家和上一位玩家各抽取一张卡牌
    game.drawCards(player, 1);
    game.drawCards(prevPlayer, 1);

    console.log(`玩家 ${player.id} 和上一位玩家 ${prevPlayer.id} 已抽取卡牌`);
  }
}

/**
 * 7. 每位玩家随机舍弃一张卡牌
 */
export class AllPlayersDiscardEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      "all_players_discard",
      "大扫除",
      "每位玩家随机舍弃一张卡牌",
      false,
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    console.log(`玩家 ${player.id} 使用了每位玩家随机舍弃一张卡牌事件卡`);

    // 检查是否有玩家有卡牌
    const playersWithCards = game.players.filter((p) => p.cards.length > 0);
    if (playersWithCards.length === 0) {
      console.log("所有玩家都没有卡牌可以舍弃");
      return;
    }

    // 为每个有卡牌的玩家触发选择卡牌事件
    const discardPromises = playersWithCards.map(async (p) => {
      if (p.cards.length === 0) {
        console.log(`玩家 ${p.id} 没有卡牌可以舍弃`);
        return {
          player: p,
          selectedCardIds: [],
        };
      }
      // 触发玩家选择卡牌事件
      const selectionResult = await game.eventSystem.waitForCardChoice<
        CardSelectionPayload[0],
        CardSelectionPayload[1]
      >({
        type: "CARD_CHOICE",
        playerId: p.id,
        eventData: {
          cards: p.cards,
          isHidden: true,
          minSelection: 1,
          maxSelection: 1,
          title: "舍弃卡牌",
          description: "请选择一张要舍弃的卡牌",
        },
      });

      return {
        player: p,
        selectedCardIds: selectionResult.selectedCardIds,
      };
    });

    // 等待所有玩家选择完成
    const discardResults = await Promise.all(discardPromises);

    // 处理每个玩家的弃牌
    for (const result of discardResults) {
      const { player: p, selectedCardIds } = result;

      // 如果玩家没有选择卡牌（取消操作），跳过该玩家
      if (selectedCardIds.length === 0) {
        console.log(`玩家 ${p.id} 取消了舍弃卡牌操作`);
        continue;
      }

      // 从玩家手中弃掉选中的卡牌
      game.discardCards(p, selectedCardIds);
    }

    console.log("所有玩家已处理舍弃卡牌事件");
  }
}

/**
 * 8. 选择一位玩家进行扔骰子的PK，如果你获胜可以抽取对方一张卡牌，失败则不抽取
 */
export class DiceBattleStealEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      "dice_battle_steal",
      "命运对决",
      "选择一位玩家进行扔骰子的PK，如果你获胜可以抽取对方一张卡牌，失败则不抽取",
      false,
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    console.log(`玩家 ${player.id} 使用了选择一位玩家进行扔骰子的PK事件卡`);

    // 1. 触发一个选择玩家的事件，等待事件结束可能返回一个玩家 id
    // 获取除当前玩家外的所有玩家
    const allPlayers = game.players;
    const availablePlayers = allPlayers.filter((p) => p.id !== player.id);

    // 如果没有其他玩家，直接返回
    if (availablePlayers.length === 0) {
      console.log("没有其他玩家可以进行骰子对决");
      return;
    }

    // 触发玩家选择事件
    const selectionResult = await game.eventSystem.waitForPlayerChoice<
      PlayerSelectionPayload[0],
      PlayerSelectionPayload[1]
    >({
      type: "PLAYER_CHOICE",
      playerId: player.id,
      eventData: {
        currentPlayer: player,
        availablePlayers: availablePlayers,
        description: "选择一位玩家进行骰子对决",
        canCancel: true,
      },
    });

    // 获取选择的玩家ID
    const selectedPlayerId = selectionResult.selectedPlayerId;

    // 如果玩家放弃选择，直接返回
    if (selectedPlayerId === null) {
      console.log("玩家放弃骰子对决");
      return;
    }

    // 获取选中的玩家对象
    const selectedPlayer = game.getPlayer(selectedPlayerId);

    // 如果选择玩家无卡牌，则直接结束
    if (selectedPlayer.cards.length === 0) {
      console.log(`玩家 ${selectedPlayer.id} 没有卡牌可以偷取`);
      return;
    }

    // 2. 当前玩家触发一个扔骰子事件
    const currentPlayerRollResult = await game.eventSystem.waitForPlayerChoice<
      DiceRollPayload[0],
      DiceRollPayload[1]
    >({
      type: "DICE_ROLL",
      playerId: player.id,
      eventData: {
        player: {
          id: player.id,
          name: player.name,
        },
        description: "请掷骰子进行对决",
      },
    });

    const currentPlayerDiceResult = currentPlayerRollResult.diceResult;

    // 3. 换到选中的玩家触发一个扔骰子事件
    const selectedPlayerRollResult = await game.eventSystem.waitForPlayerChoice<
      DiceRollPayload[0],
      DiceRollPayload[1]
    >({
      type: "DICE_ROLL",
      playerId: selectedPlayer.id,
      eventData: {
        player: {
          id: selectedPlayer.id,
          name: selectedPlayer.name,
        },
        description: "请掷骰子进行对决",
      },
    });

    const selectedPlayerDiceResult = selectedPlayerRollResult.diceResult;

    // 4. 拿到两个玩家扔骰子的结果进行比较
    console.log(
      `骰子对决结果：玩家 ${player.id} 骰子总和 ${currentPlayerDiceResult.total} vs 玩家 ${selectedPlayer.id} 骰子总和 ${selectedPlayerDiceResult.total}`,
    );

    // 如果当前玩家的骰子结果更大
    if (currentPlayerDiceResult.total > selectedPlayerDiceResult.total) {
      // 触发一个选中卡牌的事件，将选中玩家的所有卡牌放入到选择池子，限定选择一张
      const cardSelectionResult = await game.eventSystem.waitForCardChoice<
        CardSelectionPayload[0],
        CardSelectionPayload[1]
      >({
        type: "CARD_CHOICE",
        playerId: player.id,
        eventData: {
          cards: selectedPlayer.cards,
          isHidden: false,
          minSelection: 1,
          maxSelection: 1,
          title: "选择一张卡牌",
          description: `请选择从玩家 ${selectedPlayer.name} 那里偷取的卡牌`,
        },
      });

      const selectedCardIds = cardSelectionResult.selectedCardIds;

      // 如果玩家没有选择卡牌（取消操作），直接返回
      if (selectedCardIds.length === 0) {
        console.log("玩家取消了偷取卡牌操作");
        return;
      }

      // 获取选中的卡牌
      const selectedCardId = selectedCardIds[0];
      const selectedCard = selectedPlayer.cards.find(
        (card) => card.id === selectedCardId,
      );

      if (selectedCard) {
        // 将选中的卡牌从选中玩家手牌中移除
        selectedPlayer.removeCard(selectedCardId);

        // 将选中的卡牌放入当前玩家手牌
        player.addCard(selectedCard);

        console.log(
          `玩家 ${player.id} 成功从玩家 ${selectedPlayer.id} 那里偷取了卡牌 ${selectedCard.name}`,
        );
      }
    } else {
      // 如果当前玩家的骰子结果更小，或骰子结果相等，则当前玩家不获得对方的卡牌
      console.log(
        `玩家 ${player.id} 在骰子对决中失败，未能从玩家 ${selectedPlayer.id} 那里偷取卡牌`,
      );
    }
  }
}

/**
 * 创建标准事件牌堆
 */
export function createStandardEventDeck(): BaseEventCard[] {
  const eventCards: BaseEventCard[] = [];
  let cardId = 1;

  // 1. 可与场上任一玩家互换所有卡牌
  eventCards.push(new SwapAllCardsEventCard(cardId++));

  // 2. 下一关BOSS的PK直接通关（玩家可保留此卡）
  eventCards.push(new BossBattlePassEventCard(cardId++));

  // 3. 你随机舍弃一张卡牌
  eventCards.push(new RandomDiscardEventCard(cardId++));

  // 4. 你与下一位玩家随机舍弃一张卡牌
  eventCards.push(new NextPlayerDiscardEventCard(cardId++));

  // 5. 每位玩家从功能卡堆中抽取一张卡牌
  eventCards.push(new AllPlayersDrawEventCard(cardId++));

  // 6. 你与上一位玩家从功能卡堆中抽取一张卡牌
  eventCards.push(new PrevPlayerDrawEventCard(cardId++));

  // 7. 每位玩家随机舍弃一张卡牌
  eventCards.push(new AllPlayersDiscardEventCard(cardId++));

  // 8. 选择一位玩家进行扔骰子的PK，如果你获胜可以抽取对方一张卡牌，失败则不抽取
  eventCards.push(new DiceBattleStealEventCard(cardId++));

  return eventCards;
}

// 为了向后兼容，保留原有的EventCard类作为BaseEventCard的别名
export const EventCard = BaseEventCard;
