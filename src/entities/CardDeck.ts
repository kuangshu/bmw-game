import { Card } from './Player'

export class CardDeck {
  private _cards: Card[]
  private _discardPile: Card[] = []

  constructor(cards: Card[] = []) {
    this._cards = [...cards]
  }

  // 获取牌堆中的卡片数量
  get size(): number {
    return this._cards.length
  }

  // 获取弃牌堆中的卡片数量
  get discardSize(): number {
    return this._discardPile.length
  }

  // 洗牌
  shuffle(): void {
    for (let i = this._cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]]
    }
  }

  // 从牌堆顶部抽取指定数量的卡片
  draw(count: number): Card[] {
    if (count <= 0 || count > this._cards.length) {
      throw new Error(`无法抽取 ${count} 张卡片，牌堆中只有 ${this._cards.length} 张`)
    }

    const drawnCards = this._cards.splice(0, count)
    return drawnCards
  }

  // 将卡片添加到弃牌堆
  discard(cards: Card[]): void {
    this._discardPile.push(...cards)
  }

  // 重新洗牌（当牌堆为空时，将弃牌堆洗入牌堆）
  reshuffle(): void {
    if (this._discardPile.length === 0) {
      throw new Error('弃牌堆为空，无法重新洗牌')
    }

    this._cards = [...this._discardPile]
    this._discardPile = []
    this.shuffle()
  }

  // 检查牌堆是否为空
  isEmpty(): boolean {
    return this._cards.length === 0
  }

  // 创建标准游戏牌堆
  static createStandardDeck(): CardDeck {
    const deck: Card[] = []
    let cardId = 1
    
    // 能量卡配置
    const energyCardTypes = [
      { name: '甜筒', value: 1, count: 20 },
      { name: '薯条', value: 3, count: 16 },
      { name: '芝士汉堡', value: 6, count: 10 },
      { name: '咸蛋黄汉堡', value: 6, count: 6 }
    ]
    
    // 生成能量卡（总共52张）
    energyCardTypes.forEach(cardType => {
      for (let i = 0; i < cardType.count; i++) {
        deck.push({
          id: cardId++,
          type: 'energy',
          value: cardType.value,
          name: cardType.name,
          description: `提供 ${cardType.value} 点能量`
        })
      }
    })
    
    // 法术卡配置
    const spellCardTypes = [
      { 
        name: '定身术', 
        value: 3, 
        effect: 'fix_dice', 
        description: '指定下一次扔骰子的点数（消耗3能量）',
        count: 2
      },
      { 
        name: '分身术', 
        value: 3, 
        effect: 'extra_turn', 
        description: '多进行一次扔骰子的行为（消耗3能量）',
        count: 2
      },
      { 
        name: '聚形散气', 
        value: 6, 
        effect: 'swap_position', 
        description: '指定一个玩家和其交换位置（消耗6能量）',
        count: 2
      },
      { 
        name: '铜墙铁壁', 
        value: 4, 
        effect: 'spell_shield', 
        description: '抵消其他人对玩家使用的法术效果（消耗4能量）',
        count: 2
      }
    ]
    
    // 生成法术卡（总共8张）
    spellCardTypes.forEach(cardType => {
      for (let i = 0; i < cardType.count; i++) {
        deck.push({
          id: cardId++,
          type: 'spell',
          value: cardType.value,
          name: cardType.name,
          effect: cardType.effect,
          description: cardType.description
        })
      }
    })

    const cardDeck = new CardDeck(deck)
    cardDeck.shuffle()
    return cardDeck
  }
}