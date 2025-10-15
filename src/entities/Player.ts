// 玩家角色类型定义
export type PlayerRole = 'warrior' | 'mage' | 'rogue' | 'cleric'

// 前进方向类型定义
export type Direction = 'forward' | 'backward'

export interface Card {
  id: number
  type: 'energy' | 'spell'
  value: number
  name: string
  effect?: string
  description: string
}

// 用于序列化的玩家数据接口
export interface PlayerData {
  id: number
  name: string
  role: PlayerRole
  position: number
  cards: Card[]
  energy: number
  direction: Direction
}

export class Player {
  private _id: number
  private _name: string
  private _position: number
  private _cards: Card[]
  private _direction: Direction
  private _role: PlayerRole

  constructor(
    id: number,
    name: string,
    role: PlayerRole = 'warrior',
    position: number = 0,
    cards: Card[] = [],
    direction: Direction = 'forward'
  ) {
    this._id = id
    this._name = name
    this._role = role
    this._position = position
    this._cards = [...cards]
    this._direction = direction
  }

  // Getters
  get id(): number { return this._id }
  get name(): string { return this._name }
  get position(): number { return this._position }
  get cards(): Card[] { return [...this._cards] } // 返回副本避免直接修改
  get energy(): number { return 0 } // _energy属性已删除，返回默认值
  get direction(): Direction { return this._direction }
  get role(): PlayerRole { return this._role }

  // Setters with validation
  set position(newPosition: number) {
    if (newPosition >= 0) {
      this._position = newPosition
    }
  }

  set direction(newDirection: Direction) {
    this._direction = newDirection
  }

  // 卡片操作方法
  addCard(card: Card): void {
    this._cards.push({ ...card })
  }

  removeCard(cardId: number): boolean {
    const index = this._cards.findIndex(card => card.id === cardId)
    if (index !== -1) {
      this._cards.splice(index, 1)
      return true
    }
    return false
  }

  hasCard(cardId: number): boolean {
    return this._cards.some(card => card.id === cardId)
  }

  getCard(cardId: number): Card | undefined {
    return this._cards.find(card => card.id === cardId)
  }

  // 移动操作方法
  move(steps: number): void {
    if (this._direction === 'forward') {
      this._position += steps
    } else {
      this._position = Math.max(0, this._position - steps)
    }
  }

  reverseDirection(): void {
    this._direction = this._direction === 'forward' ? 'backward' : 'forward'
  }

  // 序列化方法（用于React状态管理）
  toJSON(): PlayerData {
    return {
      id: this._id,
      name: this._name,
      role: this._role,
      position: this._position,
      cards: [...this._cards],
      energy: 0, // _energy属性已删除，返回默认值
      direction: this._direction
    }
  }

  // 从数据对象创建Player实例
  static fromData(data: PlayerData): Player {
    return new Player(
      data.id,
      data.name,
      data.role,
      data.position,
      data.cards,
      data.direction
    )
  }
}