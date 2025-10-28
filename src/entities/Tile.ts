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

export class BaseTile implements TileData {
  readonly position: number;
  readonly type: TileType;

  constructor(position: number, type: TileType = "empty") {
    this.position = position;
    this.type = type;
  }
  // 路过格子时异步触发（默认无事发生）
  async onPass(_game: Game, _player: Player): Promise<void> {
    // 默认无事发生
    // 注意：子类应该重写此方法以实现特定格子的路过效果
  }
  // 停留格子时异步触发（默认无事发生）
  async onStay(_game: Game, _player: Player): Promise<void> {
    // 默认无事发生
    // 注意：子类应该重写此方法以实现特定格子的停留效果
  }

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
        return "BOSS格，需要足够能量击败BOSS";
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
    // 触发事件卡抽取事件
    await game.eventSystem.waitForPlayerChoice({
      type: "EVENT_CARD_DRAW",
      playerId: player.id,
      eventData: {
        position: this.position,
      },
    });
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
  readonly bossRequirement?: number;

  constructor(position: number, bossRequirement?: number) {
    super(position, "boss");
    this.bossRequirement = bossRequirement;
  }

  async onPass(game: Game, player: Player): Promise<void> {
    await this.handleBossBattle(game, player, 0);
  }

  async onStay(game: Game, player: Player): Promise<void> {
    await this.handleBossBattle(game, player, 0);
  }

  // 重写 description getter 以显示 bossRequirement
  get description(): string {
    return `BOSS格，需要 ${this.bossRequirement || 0} 点能量击败BOSS`;
  }

  // 重写 toJSON 方法以包含 bossRequirement
  toJSON(): TileData {
    return {
      position: this.position,
      type: this.type,
      bossRequirement: this.bossRequirement,
    };
  }

  private async handleBossBattle(
    game: Game,
    player: Player,
    diceTotal: number,
  ): Promise<void> {
    if (!this.bossRequirement) return;

    const bossBattleData = {
      position: this.position,
      requirement: this.bossRequirement || 0,
      originalPosition: player.position,
      remainingSteps: diceTotal,
    };

    console.log(
      `⚔️ ${player.name} 进入BOSS战斗！需要 ${this.bossRequirement} 点能量`,
    );

    // 直接触发BOSS战斗出牌事件
    const playResult = await game.eventSystem.waitForPlayerChoice<
      BossBattlePlayCardsPayload[0],
      BossBattlePlayCardsPayload[1]
    >({
      type: "BOSS_BATTLE_PLAY_CARDS",
      playerId: player.id,
      eventData: { requirement: this.bossRequirement || 0 },
    });

    // 移除所有选中的卡片
    if (playResult.playedCards && playResult.playedCards.length > 0) {
      for (const card of playResult.playedCards) {
        player.removeCard(card.id);
      }
    }

    if (playResult.defeatedBoss) {
      // 成功击败BOSS，继续前进
      console.log(`🎉 ${player.name} 成功击败BOSS！`);
    } else {
      // 未击败BOSS，回到上一关BOSS位置
      console.log(`💨 ${player.name} 未击败BOSS，撤退到上一关`);

      // 找到上一个BOSS位置
      const previousBossPosition = this.findPreviousBossPosition(
        game,
        bossBattleData.position,
      );

      // 将玩家移回上一个BOSS位置
      player.position = previousBossPosition;
    }
  }

  // 找到上一个BOSS位置
  private findPreviousBossPosition(
    game: Game,
    currentPosition: number,
  ): number {
    const bossPositions = game.gameBoard.tiles
      .filter((tile: BaseTile) => tile.type === "boss")
      .map((tile: BaseTile) => tile.position)
      .sort((a: number, b: number) => a - b);

    // 找到当前BOSS之前的所有BOSS位置
    const previousBosses = bossPositions.filter(
      (pos: number) => pos < currentPosition,
    );

    // 返回最后一个BOSS位置，如果没有则返回起点(0)
    return previousBosses.length > 0
      ? previousBosses[previousBosses.length - 1]
      : 0;
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
    // 传送逻辑：跳转到下一个传送门
    let currentPos = this.position;
    // 寻找下一个传送门
    for (let i = currentPos + 1; i < game.gameBoard.totalTiles; i++) {
      const tile = game.gameBoard.getTile(i);
      if (tile && tile.type === "teleport") {
        player.position = tile.position;
        console.log(`✨ ${player.name} 传送至位置 ${tile.position}`);
        return;
      }
    }
    // 如果没找到，传送到终点
    player.position = game.gameBoard.totalTiles - 1;
    console.log(
      `✨ ${player.name} 传送至终点 ${game.gameBoard.totalTiles - 1}`,
    );
  }
}

// 3D 展示支持（需要 three.js & Render 类）
import * as THREE from "three";
import type { Render } from "../components/Render";
import { BossBattlePlayCardsPayload } from "../components/GameEventLayer/BossBattlePlayCardsEvent";

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
      (row - gridSize / 2) * tileSpacing,
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
