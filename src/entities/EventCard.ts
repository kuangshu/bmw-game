import type { Game } from './Game';
import type { Player } from './Player';

/**
 * 事件卡牌类型定义
 */
export type EventCardType = 
  | 'swap_all_cards'           // 1. 可与场上任一玩家互换所有卡牌
  | 'boss_battle_pass'         // 2. 下一关BOSS的PK直接通关（玩家可保留此卡）
  | 'random_discard'            // 3. 你随机舍弃一张卡牌
  | 'next_player_discard'       // 4. 你与下一位玩家随机舍弃一张卡牌
  | 'all_players_draw'          // 5. 每位玩家从功能卡堆中抽取一张卡牌
  | 'prev_player_draw'          // 6. 你与上一位玩家从功能卡堆中抽取一张卡牌
  | 'all_players_discard'       // 7. 每位玩家随机舍弃一张卡牌
  | 'dice_battle_steal'         // 8. 选择一位玩家进行扔骰子的PK，如果你获胜可以抽取对方一张卡牌，失败则不抽取

/**
 * 事件卡牌接口
 */
export interface EventCard {
  id: number;
  type: EventCardType;
  name: string;
  description: string;
  keepable: boolean;  // 是否可以被玩家保留
  
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

  constructor(id: number, type: EventCardType, name: string, description: string, keepable: boolean = false) {
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
    return `${this.name}: ${this.description}${this.keepable ? ' (可保留)' : ''}`;
  }
}

/**
 * 1. 可与场上任一玩家互换所有卡牌
 */
export class SwapAllCardsEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      'swap_all_cards',
      '命运交换',
      '可与场上任一玩家互换所有卡牌',
      false
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    // TODO: 实现交换所有玩家手牌的逻辑
    console.log(`玩家 ${player.id} 使用了交换所有玩家手牌事件卡`);
    
    // 添加参数使用标记
    game;
    player;
  }
}

/**
 * 2. 下一关BOSS的PK直接通关（玩家可保留此卡）
 */
export class BossBattlePassEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      'boss_battle_pass',
      'BOSS通行证',
      '下一关BOSS的PK直接通关',
      true
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    // TODO: 实现BOSS通行证的逻辑
    console.log(`玩家 ${player.id} 使用了BOSS通行证事件卡`);
    
    // 添加参数使用标记
    game;
    player;
  }
}

/**
 * 3. 你随机舍弃一张卡牌
 */
export class RandomDiscardEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      'random_discard',
      '失物招领',
      '你随机舍弃一张卡牌',
      false
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    // TODO: 实现随机舍弃一张卡牌的逻辑
    console.log(`玩家 ${player.id} 使用了随机舍弃一张卡牌事件卡`);
    
    // 添加参数使用标记
    game;
    player;
  }
}

/**
 * 4. 你与下一位玩家随机舍弃一张卡牌
 */
export class NextPlayerDiscardEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      'next_player_discard',
      '连锁反应',
      '你与下一位玩家随机舍弃一张卡牌',
      false
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    // TODO: 实现与下一位玩家随机舍弃一张卡牌的逻辑
    console.log(`玩家 ${player.id} 使用了与下一位玩家随机舍弃一张卡牌事件卡`);
    
    // 添加参数使用标记
    game;
    player;
  }
}

/**
 * 5. 每位玩家从功能卡堆中抽取一张卡牌
 */
export class AllPlayersDrawEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      'all_players_draw',
      '全民福利',
      '每位玩家从功能卡堆中抽取一张卡牌',
      false
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    // TODO: 实现每位玩家从功能卡堆中抽取一张卡牌的逻辑
    console.log(`玩家 ${player.id} 使用了每位玩家从功能卡堆中抽取一张卡牌事件卡`);
    
    // 添加参数使用标记
    game;
    player;
  }
}

/**
 * 6. 你与上一位玩家从功能卡堆中抽取一张卡牌
 */
export class PrevPlayerDrawEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      'prev_player_draw',
      '前辈的馈赠',
      '你与上一位玩家从功能卡堆中抽取一张卡牌',
      false
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    // TODO: 实现你与上一位玩家从功能卡堆中抽取一张卡牌的逻辑
    console.log(`玩家 ${player.id} 使用了你与上一位玩家从功能卡堆中抽取一张卡牌事件卡`);
    
    // 添加参数使用标记
    game;
    player;
  }
}

/**
 * 7. 每位玩家随机舍弃一张卡牌
 */
export class AllPlayersDiscardEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      'all_players_discard',
      '大扫除',
      '每位玩家随机舍弃一张卡牌',
      false
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    // TODO: 实现每位玩家随机舍弃一张卡牌的逻辑
    console.log(`玩家 ${player.id} 使用了每位玩家随机舍弃一张卡牌事件卡`);
    
    // 添加参数使用标记
    game;
    player;
  }
}

/**
 * 8. 选择一位玩家进行扔骰子的PK，如果你获胜可以抽取对方一张卡牌，失败则不抽取
 */
export class DiceBattleStealEventCard extends BaseEventCard {
  constructor(id: number) {
    super(
      id,
      'dice_battle_steal',
      '命运对决',
      '选择一位玩家进行扔骰子的PK，如果你获胜可以抽取对方一张卡牌，失败则不抽取',
      false
    );
  }

  async execute(game: Game, player: Player): Promise<void> {
    // TODO: 实现选择一位玩家进行扔骰子的PK，如果你获胜可以抽取对方一张卡牌，失败则不抽取的逻辑
    console.log(`玩家 ${player.id} 使用了选择一位玩家进行扔骰子的PK事件卡`);
    
    // 添加参数使用标记
    game;
    player;
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