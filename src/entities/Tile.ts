/**
 * 地图格子类型定义
 * - empty: 普通格子，无特殊效果
 * - treasure: 宝箱格，触发1张事件牌
 * - reverse: 反转格，玩家转向一个回合，在下一个回合结束时回到前进方向
 * - supply: 补给站，获得2张功能牌
 * - boss: BOSS格，进入BOSS战斗需要足够能量击败BOSS，否则退回上一关BOSS的格子
 */
export type TileType =
  | "empty"
  | "treasure"
  | "reverse"
  | "supply"
  | "boss"
  | "teleport";

export interface TileData {
  position: number;
  type: TileType;
  bossRequirement?: number;
}

import type { Game } from "./Game";
import type { Player } from "./Player";

export abstract class BaseTile implements TileData {
  readonly position: number;
  readonly type: TileType;
  readonly bossRequirement?: number;

  constructor(
    position: number,
    type: TileType = "empty",
    bossRequirement?: number
  ) {
    this.position = position;
    this.type = type;
    this.bossRequirement = bossRequirement;
  }
  // 路过格子时异步触发（默认无事发生）
  async onPass(_game: Game, _player: Player): Promise<void> {}
  // 停留格子时异步触发（默认无事发生）
  async onStay(_game: Game, _player: Player): Promise<void> {}

  // 其余接口
  get description(): string {
    switch (this.type) {
      case "empty":
        return "普通格子，无特殊效果";
      case "treasure":
        return "宝箱格，触发1张事件牌";
      case "reverse":
        return "反转格，玩家转向一个回合";
      case "supply":
        return "补给站，获得2张功能牌";
      case "boss":
        return `BOSS格，需要 ${this.bossRequirement} 点能量击败BOSS`;
      default:
        return "未知格子";
    }
  }
  get isSpecial(): boolean {
    return this.type !== "empty";
  }
  get isBoss(): boolean {
    return this.type === "boss";
  }
  toJSON(): TileData {
    return {
      position: this.position,
      type: this.type,
      bossRequirement: this.bossRequirement,
    };
  }
  // 静态工厂保底
  static fromData(data: TileData): BaseTile {
    switch (data.type) {
      case "teleport":
        return new TeleportTile(data.position);
      case "treasure":
        return new TreasureTile(data.position);
      case "reverse":
        return new ReverseTile(data.position);
      case "supply":
        return new SupplyTile(data.position);
      case "boss":
        return new BossTile(data.position, data.bossRequirement);
      default:
        return new EmptyTile(data.position);
    }
  }
}
/**
 * 空格子
 */
export class EmptyTile extends BaseTile {
  constructor(position: number) {
    super(position, "empty");
  }
}

/**
 * 宝箱格，抽取一张事件牌触发
 */
export class TreasureTile extends BaseTile {
  constructor(position: number) {
    super(position, "treasure");
  }
  async onStay(game: Game, player: Player): Promise<void> {
    // 触发抽卡异步交互，game.cardDeck/integrate actual logic
    if (!game.cardDeck.isEmpty()) {
      const card = game.cardDeck.draw(1)[0];
      player.addCard(card);
    }
  }
}

/**
 * 补给站格，获得2张功能牌
 */
export class SupplyTile extends BaseTile {
  constructor(position: number) {
    super(position, "supply");
  }
  async onPass(game: Game, player: Player): Promise<void> {
    // 经过补给站时抽取2张卡片
    const drawnCards = game.cardDeck.draw(2);
    drawnCards.forEach((card: any) => player.addCard(card));
  }
  async onStay(game: Game, player: Player): Promise<void> {
    // 停留获得补给，抽取2张卡片
    const drawnCards = game.cardDeck.draw(2);
    drawnCards.forEach((card: any) => player.addCard(card));
  }
}

/**
 * 反转格，玩家转向一个回合，在下一个回合结束时回到前进方向
 */
export class ReverseTile extends BaseTile {
  constructor(position: number) {
    super(position, "reverse");
  }
  async onStay(_game: Game, player: Player): Promise<void> {
    player.reverseDirection();
  }
}

/**
 * BOSS格，进入BOSS战斗需要足够能量击败BOSS，否则退回上一关BOSS的格子
 */
export class BossTile extends BaseTile {
  constructor(position: number, bossRequirement?: number) {
    super(position, "boss", bossRequirement);
  }
  async onPass(game: Game, player: Player): Promise<void> {
    await game.waitForPlayerChoice(this);
  }
  async onStay(game: Game, player: Player): Promise<void> {
    await game.waitForPlayerChoice(this);
  }
}

/**
 * 传送格，停留时自动将玩家传送到前方最近的空白格子。
 */
export class TeleportTile extends BaseTile {
  constructor(position: number) {
    super(position, "teleport");
  }

  async onStay(game: Game, player: Player): Promise<void> {
    const currentPos = this.position;
    // 从当前位置向前搜寻下一个空白格子位置（不包括自己）
    for (let i = currentPos + 1; i < game.gameBoard.totalTiles; i++) {
      const tile = game.gameBoard.getTile(i);
      if (tile && tile.type === "empty") {
        player.position = i;
        break;
      }
    }
  }
}

// 3D 展示支持（需要 three.js & Render 类）
import * as THREE from "three";
import type { Render } from "../components/Render";

export class Tile3D {
  public mesh: THREE.Mesh;
  public tileData: TileData;

  constructor(tileData: TileData) {
    this.tileData = tileData;
    this.mesh = this.createMesh();
  }

  createMesh() {
    const gridSize = 9;
    const tileSpacing = 2;
    const geometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
    let material: THREE.Material;
    switch (this.tileData.type) {
      case "boss":
        material = new THREE.MeshLambertMaterial({ color: 0x800080 });
        break;
      case "treasure":
        material = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        break;
      case "reverse":
        material = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        break;
      case "supply":
        material = new THREE.MeshLambertMaterial({ color: 0x32cd32 });
        break;
      default:
        material = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
    }
    const mesh = new THREE.Mesh(geometry, material);
    const row = Math.floor(this.tileData.position / gridSize);
    const col = this.tileData.position % gridSize;
    mesh.position.set(
      (col - gridSize / 2) * tileSpacing,
      0,
      (row - gridSize / 2) * tileSpacing
    );
    return mesh;
  }

  addToRender(render: Render) {
    render.addObject(this.mesh);
  }

  removeFromRender(render: Render) {
    render.removeObject(this.mesh);
  }
}

// 职业-格子行为类型向全局导出
export interface RoleTileHandler {
  onPass?: (game: Game, player: Player, tile: BaseTile) => Promise<void> | void;
  onStay?: (game: Game, player: Player, tile: BaseTile) => Promise<void> | void;
}
