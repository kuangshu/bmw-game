
// 定义游戏事件类型
export type GameEventType = 
  // 法术卡事件
  | "SPELL_FIX_DICE"           // 定身术：指定骰子点数
  | "SPELL_SWAP_POSITION"      // 交换位置
  | "SPELL_EXTRA_TURN"         // 额外回合
  | "SPELL_SHIELD"             // 护盾
  
  // BOSS战斗事件
  | "BOSS_BATTLE_START"        // BOSS战斗开始
  | "BOSS_BATTLE_PLAY_CARDS"   // BOSS战斗出牌
  | "BOSS_BATTLE_DISCARD"      // BOSS战斗弃牌撤退
  
  // 格子事件
  | "TILE_TREASURE"            // 宝箱格
  | "TILE_REVERSE"             // 反转格
  | "TILE_SUPPLY"              // 补给站
  | "TILE_TELEPORT"            // 传送格
  
  // 游戏事件
  | "GAME_OVER"                // 游戏结束
  | "TURN_END"                 // 回合结束
  | "PLAYER_CHOICE"            // 玩家选择
  | "CUSTOM";                  // 自定义事件

// 事件数据接口
export interface GameEventData {
  // 通用字段
  type: GameEventType;
  playerId?: number;
  timestamp: number;
  
  // 特定事件数据
  spellCardId?: number;
  bossBattleData?: {
    position: number;
    requirement: number;
    originalPosition: number;
    remainingSteps: number;
  };
  tileData?: {
    position: number;
    type: string;
  };
  customData?: any;
  
  // 选项参数
  options?: any;
}

// 事件回调函数类型
export type GameEventCallback = (result: any) => void;

// 事件监听器接口
export interface GameEventListener {
  eventType: GameEventType;
  callback: GameEventCallback;
}

/**
 * 游戏事件系统类
 * 负责管理游戏中的各种异步事件和玩家交互
 */
export class GameEventSystem {
  private events: GameEventData[] = [];
  private listeners: GameEventListener[] = [];
  private pendingEvents: Map<string, GameEventCallback> = new Map();
  
  /**
   * 发布事件
   * @param event 事件数据
   * @returns 事件ID，用于后续处理结果
   */
  publishEvent(event: Omit<GameEventData, 'timestamp'>): string {
    const eventWithTimestamp: GameEventData = {
      ...event,
      timestamp: Date.now()
    };
    
    // 添加到事件队列
    this.events.push(eventWithTimestamp);
    
    // 生成事件ID
    const eventId = `event_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // 通知监听器
    this.notifyListeners(eventWithTimestamp);
    
    return eventId;
  }
  
  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  subscribe(eventType: GameEventType, callback: GameEventCallback): void {
    this.listeners.push({ eventType, callback });
  }
  
  /**
   * 取消订阅事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  unsubscribe(eventType: GameEventType, callback: GameEventCallback): void {
    this.listeners = this.listeners.filter(
      listener => !(listener.eventType === eventType && listener.callback === callback)
    );
  }
  
  /**
   * 通知监听器
   * @param event 事件数据
   */
  private notifyListeners(event: GameEventData): void {
    this.listeners
      .filter(listener => listener.eventType === event.type)
      .forEach(listener => listener.callback(event));
  }
  
  /**
   * 等待玩家选择（返回Promise）
   * @param event 事件数据
   * @returns Promise，解析为用户选择的结果
   */
  waitForPlayerChoice<T>(event: Omit<GameEventData, 'timestamp'>): Promise<T> {
    return new Promise((resolve) => {
      const eventId = this.publishEvent(event);
      this.pendingEvents.set(eventId, resolve as GameEventCallback);
    });
  }
  
  /**
   * 完成事件处理并返回结果
   * @param eventId 事件ID
   * @param result 处理结果
   */
  completeEvent(eventId: string, result: any): void {
    const resolve = this.pendingEvents.get(eventId);
    if (resolve) {
      resolve(result);
      this.pendingEvents.delete(eventId);
    }
  }
  
  /**
   * 获取待处理事件
   */
  getPendingEvent(): GameEventData | undefined {
    if (this.events.length > 0) {
      return this.events[0];
    }
    return undefined;
  }
  
  /**
   * 移除已处理的事件
   */
  removeProcessedEvent(): void {
    if (this.events.length > 0) {
      this.events.shift();
    }
  }
  
  /**
   * 清空所有事件
   */
  clearEvents(): void {
    this.events = [];
    this.pendingEvents.clear();
  }
}

// 导出类型和类
export default GameEventSystem;
