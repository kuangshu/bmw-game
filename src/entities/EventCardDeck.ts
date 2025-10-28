import { EventCard, createStandardEventDeck } from "./EventCard";
import type { Game } from "./Game";
import type { Player } from "./Player";

/**
 * 事件牌堆管理类
 */
export class EventCardDeck {
  private _cards: EventCard[] = [];
  private _playerKeepableCards: Map<number, EventCard[]> = new Map(); // 玩家ID -> 可保留的事件卡牌列表

  constructor(cards?: EventCard[]) {
    this._cards = cards ? [...cards] : [];
  }

  // 获取牌堆中的卡片数量
  get size(): number {
    return this._cards.length;
  }

  // 获取所有卡牌（用于UI展示）
  getAllCards(): EventCard[] {
    return [...this._cards];
  }

  // 洗牌
  shuffle(): void {
    for (let i = this._cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
    }
  }

  // 获取指定的卡牌（用于玩家选择）
  getCard(cardId: number): EventCard | null {
    return this._cards.find((card) => card.id === cardId) || null;
  }

  // 执行选中的事件卡效果
  async executeEventCard(
    game: Game,
    player: Player,
    cardId: number,
  ): Promise<void> {
    const card = this.getCard(cardId);
    if (!card) {
      console.warn("找不到指定的事件卡");
      return;
    }

    console.log(`🎲 ${player.name} 选择事件: ${card.getDetails()}`);

    // 如果是可保留卡牌，添加到玩家保留区
    if (card.keepable) {
      this.addKeepableCardToPlayer(player.id, card);
      console.log(`💾 ${player.name} 获得了可保留卡牌: ${card.name}`);
    } else {
      // 执行事件效果
      await card.execute(game, player);

      // 事件完成后，打乱牌堆顺序
      this.shuffle();
    }
  }

  // 检查牌堆是否为空
  isEmpty(): boolean {
    return this._cards.length === 0;
  }

  // 获取玩家保留的可保留卡牌
  getPlayerKeepableCards(playerId: number): EventCard[] {
    return this._playerKeepableCards.get(playerId) || [];
  }

  // 添加可保留卡牌到玩家
  addKeepableCardToPlayer(playerId: number, card: EventCard): void {
    if (!card.keepable) {
      throw new Error("只有可保留的卡牌才能添加到玩家保留区");
    }

    if (!this._playerKeepableCards.has(playerId)) {
      this._playerKeepableCards.set(playerId, []);
    }

    this._playerKeepableCards.get(playerId)!.push(card);
  }

  // 玩家使用可保留卡牌
  async useKeepableCard(
    game: Game,
    playerId: number,
    cardId: number,
  ): Promise<void> {
    const playerCards = this._playerKeepableCards.get(playerId);
    if (!playerCards) return;

    const cardIndex = playerCards.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) return;

    const card = playerCards.splice(cardIndex, 1)[0];

    // 执行事件效果
    await card.execute(game, game.getPlayer(playerId));

    // 使用后，将卡牌重新放回事件牌堆
    this._cards.push(card);

    // 打乱牌堆顺序
    this.shuffle();

    console.log(
      `🔄 ${game.getPlayer(playerId).name} 使用了事件卡: ${card.name}，卡牌已返回牌堆`,
    );
  }

  // 将事件卡返回到事件卡堆（用于处理玩家手牌中的事件卡）
  returnEventCards(cardIds: number[]): void {
    // 从玩家保留区中查找这些卡牌
    for (const [playerId, cards] of this._playerKeepableCards.entries()) {
      const cardsToReturn: EventCard[] = [];
      const remainingCards: EventCard[] = [];

      // 分离需要返回的卡牌和保留的卡牌
      for (const card of cards) {
        if (cardIds.includes(card.id)) {
          cardsToReturn.push(card);
        } else {
          remainingCards.push(card);
        }
      }

      // 更新玩家保留区的卡牌列表
      if (cardsToReturn.length > 0) {
        this._playerKeepableCards.set(playerId, remainingCards);

        // 将卡牌放回事件卡堆
        this._cards.push(...cardsToReturn);

        console.log(
          `📤 玩家 ${playerId} 的 ${cardsToReturn.length} 张事件卡已返回事件卡堆`,
        );
      }
    }

    // 打乱牌堆顺序
    this.shuffle();
  }

  // 创建标准事件牌堆
  static createStandardEventDeck(): EventCardDeck {
    const cards = createStandardEventDeck();
    const deck = new EventCardDeck(cards);
    deck.shuffle();
    return deck;
  }
}
