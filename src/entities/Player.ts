import type { Game } from "./Game";
import type { BaseTile, RoleTileHandler } from "./Tile";

// 玩家角色类型定义
export type PlayerRole =
  | "destiny" // 天命人
  | "sister_four" // 四妹
  | "pigsy" // 猪八戒
  | "big_bird" // 大鸟姐姐
  | "thief" // 神偷大盗
  | "milkshake"; // 奶昔大哥

// 前进方向类型定义
export type Direction = "forward" | "backward";

// 卡牌效果类型
export type CardEffectType =
  | "fix_dice"
  | "extra_turn"
  | "swap_position"
  | "spell_shield";

export interface Card {
  id: number;
  type: "energy" | "spell" | "event";
  value: number;
  name: string;
  effect?: CardEffectType;
  description: string;
}

// 用于序列化的玩家数据接口
export interface PlayerData {
  id: number;
  name: string;
  role: PlayerRole;
  position: number;
  cards: Card[];
  direction: Direction;
}

export class Player {
  private _id: number;
  private _name: string;
  private _position: number;
  private _cards: Card[];
  private _direction: Direction;
  private _role: PlayerRole;

  constructor(
    id: number,
    name: string,
    role: PlayerRole = "destiny",
    position: number = 0,
    cards: Card[] = [],
    direction: Direction = "forward",
  ) {
    this._id = id;
    this._name = name;
    this._role = role;
    this._position = position;
    this._cards = [...cards];
    this._direction = direction;
  }

  // Getters
  get id(): number {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get position(): number {
    return this._position;
  }
  get cards(): Card[] {
    return [...this._cards];
  } // 返回副本避免直接修改
  get direction(): Direction {
    return this._direction;
  }
  get role(): PlayerRole {
    return this._role;
  }

  // Setters with validation
  set position(newPosition: number) {
    if (newPosition >= 0) {
      this._position = newPosition;
    }
  }

  set direction(newDirection: Direction) {
    this._direction = newDirection;
  }

  // 卡片操作方法
  addCard(card: Card): void {
    this._cards.push({ ...card });
  }

  removeCard(cardId: number): boolean {
    const index = this._cards.findIndex((card) => card.id === cardId);
    if (index !== -1) {
      this._cards.splice(index, 1);
      return true;
    }
    return false;
  }

  hasCard(cardId: number): boolean {
    return this._cards.some((card) => card.id === cardId);
  }

  getCard(cardId: number): Card | undefined {
    return this._cards.find((card) => card.id === cardId);
  }

  // 移动操作方法
  move(steps: number): void {
    if (this._direction === "forward") {
      this._position += steps;
    } else {
      this._position = Math.max(0, this._position - steps);
    }
  }

  reverseDirection(): void {
    this._direction = this._direction === "forward" ? "backward" : "forward";
  }

  // 序列化方法（用于React状态管理）
  toJSON(): PlayerData {
    return {
      id: this._id,
      name: this._name,
      role: this._role,
      position: this._position,
      cards: [...this._cards],
      direction: this._direction,
    };
  }

  // 从数据对象创建Player实例
  static fromData(data: PlayerData): Player {
    return new Player(
      data.id,
      data.name,
      data.role,
      data.position,
      data.cards,
      data.direction,
    );
  }

  // 职业 tile 处理钩子，默认无特殊处理
  getTileHandlers(): { [K in import("./Tile").TileType]?: RoleTileHandler } {
    return {};
  }
}

// 天命人
export class DestinyPlayer extends Player {
  getTileHandlers() {
    return {
      // supply: { ... }, // 例：可在此填写天命人处理格子逻辑
    };
  }
}
// 四妹
export class SisterFourPlayer extends Player {
  getTileHandlers() {
    return {};
  }
}
// 猪八戒
export class PigsyPlayer extends Player {
  getTileHandlers() {
    return {};
  }
}
// 大鸟姐姐
export class BigBirdPlayer extends Player {
  getTileHandlers() {
    return {};
  }
}
// 神偷大盗
export class ThiefPlayer extends Player {
  getTileHandlers() {
    return {
      supply: {
        onPass: async (game: Game, player: Player, _tile: BaseTile) => {
          // 路过补给站也抽3张卡
          if (!game.cardDeck.isEmpty()) {
            game.drawCards(player, 3);
          }
        },
        onStay: async (game: Game, player: Player, _tile: BaseTile) => {
          // 停留补给站抽3张卡，而不是默认2张
          if (!game.cardDeck.isEmpty()) {
            game.drawCards(player, 3);
          }
        },
      },
    };
  }
}
// 奶昔大哥
export class MilkshakePlayer extends Player {
  getTileHandlers() {
    return {
      supply: {
        onPass: async (game: Game, player: Player, tile: BaseTile) => {
          // 先执行 tile 的原生处理方法
          await tile.onPass(game, player);

          // 额外增加2步移动
          game.addMoveSteps(2);
        },
        onStay: async (game: Game, player: Player, tile: BaseTile) => {
          // 先执行 tile 的原生处理方法
          await tile.onStay(game, player);

          // 额外增加2步移动
          game.addMoveSteps(2);
        },
      },
    };
  }
}

// 角色工厂函数
export function createPlayer(
  id: number,
  name: string,
  role: PlayerRole,
  position: number = 0,
  cards: Card[] = [],
): Player {
  switch (role) {
    case "destiny":
      return new DestinyPlayer(id, name, role, position, cards);
    case "sister_four":
      return new SisterFourPlayer(id, name, role, position, cards);
    case "pigsy":
      return new PigsyPlayer(id, name, role, position, cards);
    case "big_bird":
      return new BigBirdPlayer(id, name, role, position, cards);
    case "thief":
      return new ThiefPlayer(id, name, role, position, cards);
    case "milkshake":
      return new MilkshakePlayer(id, name, role, position, cards);
    default:
      return new DestinyPlayer(id, name, "destiny", position, cards);
  }
}

// 3D 展示支持（需要 three.js & Render 类）
import * as THREE from "three";
import type { Render } from "../components/Render";

export class Player3D {
  public mesh: THREE.Mesh;
  public playerId: number;

  constructor(playerData: PlayerData, color: number = 0xff0000) {
    this.playerId = playerData.id;
    this.mesh = this.createMarkerMesh(playerData, color);
  }

  createMarkerMesh(playerData: PlayerData, color: number) {
    const gridSize = 9;
    const tileSpacing = 2;
    const geometry = new THREE.SphereGeometry(0.3);
    const material = new THREE.MeshLambertMaterial({ color });
    const row = Math.floor(playerData.position / gridSize);
    const col = playerData.position % gridSize;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (col - gridSize / 2) * tileSpacing,
      0.5,
      (row - gridSize / 2) * tileSpacing,
    );
    return mesh;
  }

  updatePosition(position: number) {
    const gridSize = 9;
    const tileSpacing = 2;
    const row = Math.floor(position / gridSize);
    const col = position % gridSize;
    this.mesh.position.set(
      (col - gridSize / 2) * tileSpacing,
      0.5,
      (row - gridSize / 2) * tileSpacing,
    );
  }

  addToRender(render: Render) {
    render.addObject(this.mesh);
  }

  removeFromRender(render: Render) {
    render.removeObject(this.mesh);
  }
}
