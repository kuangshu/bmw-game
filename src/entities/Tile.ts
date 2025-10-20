/**
 * 地图格子类型定义
 * - empty: 普通格子，无特殊效果
 * - treasure: 宝箱格，触发1张事件牌
 * - reverse: 反转格，玩家转向一个回合，在下一个回合结束时回到前进方向
 * - supply: 补给站，获得2张功能牌
 * - boss: BOSS格，进入BOSS战斗需要足够能量击败BOSS，否则退回上一关BOSS的格子
 */
export type TileType = 'empty' | 'treasure' | 'reverse' | 'supply' | 'boss'

export interface TileData {
  position: number
  type: TileType
  bossRequirement?: number
}

export class Tile implements TileData {
  readonly position: number
  readonly type: TileType
  readonly bossRequirement?: number

  constructor(position: number, type: TileType = 'empty', bossRequirement?: number) {
    this.position = position
    this.type = type
    this.bossRequirement = bossRequirement
  }

  // 获取格子的描述信息
  get description(): string {
    switch (this.type) {
      case 'empty':
        return '普通格子，无特殊效果'
      case 'treasure':
        return '宝箱格，触发1张事件牌'
      case 'reverse':
        return '反转格，玩家转向一个回合，在下一个回合结束时回到前进方向'
      case 'supply':
        return '补给站，获得2张功能牌'
      case 'boss':
        return `BOSS格，需要 ${this.bossRequirement} 点能量击败BOSS`
      default:
        return '未知格子类型'
    }
  }

  // 检查是否是特殊格子（非空）
  get isSpecial(): boolean {
    return this.type !== 'empty'
  }

  // 检查是否是BOSS格子
  get isBoss(): boolean {
    return this.type === 'boss'
  }

  // 序列化方法
  toJSON(): TileData {
    return {
      position: this.position,
      type: this.type,
      bossRequirement: this.bossRequirement
    }
  }

  // 从数据对象创建Tile实例
  static fromData(data: TileData): Tile {
    return new Tile(data.position, data.type, data.bossRequirement)
  }
}

// 3D 展示支持（需要 three.js & Render 类）
import * as THREE from 'three';
import type { Render } from '../components/Render';

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
      case 'boss':
        material = new THREE.MeshLambertMaterial({ color: 0x800080 });
        break;
      case 'treasure':
        material = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        break;
      case 'reverse':
        material = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        break;
      case 'supply':
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