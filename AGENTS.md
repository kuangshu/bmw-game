# AGENTS.md - BMW Game 开发指南

## 项目概述

一个基于 React + TypeScript + Three.js 的多人棋盘游戏，支持骰子投掷、卡牌机制、多种玩家角色，以及 WebGL 3D 渲染。

---

## 构建命令

```bash
# 开发
npm run dev          # 启动 Vite 开发服务器 (端口 3000)

# 构建
npm run build        # TypeScript 类型检查 + 生产构建
npm run preview      # 预览生产构建

# 代码质量
npm run lint         # 运行 ESLint (--ext ts,tsx)
npm run format       # 使用 Prettier 格式化 (src/**/*.{ts,tsx,css,md})

# 仅类型检查
npx tsc --noEmit    # 运行 TypeScript 编译器检查
```

**当前未配置测试框架。**

---

## 代码风格指南

### 通用原则

- TypeScript strict 模式已启用
- 使用中文注释（与现有代码库风格一致）
- 优先使用函数式模式；游戏实体使用类
- 文件尽量保持在 400 行以内

### 导入与组织

```typescript
// 1. 类型导入优先 (使用 'import type')
import type { Game } from "./Game";
import type { BaseTile, RoleTileHandler } from "./Tile";

// 2. 常规导入
import { Player, PlayerData, PlayerRole, createPlayer } from "./Player";
import { CardDeck } from "./CardDeck";

// 3. 外部依赖
import * as THREE from "three";
import React from "react";

// 顺序：类型 → 内部模块 → 外部依赖
```

### 命名规范

| 元素          | 规范                 | 示例                                          |
| ------------- | -------------------- | --------------------------------------------- |
| 文件          | PascalCase           | `GameEventSystem.ts`, `DiceRoller.tsx`        |
| 组件          | PascalCase           | `WebGLBoard.tsx`, `PlayerHand.tsx`            |
| 类            | PascalCase           | `class Player`, `class Game`                  |
| 接口          | PascalCase           | `interface GameState`, `interface PlayerData` |
| 类型          | PascalCase           | `type PlayerRole`, `type Direction`           |
| 函数          | camelCase            | `createPlayer()`, `initializeGame()`          |
| 变量          | camelCase            | `gameInstance`, `currentPlayerIndex`          |
| 私有字段      | _camelCase           | `_players`, `_currentPlayerIndex`             |
| 常量          | UPPER_SNAKE_CASE     | `GAME_CONFIG`, `PLAYER_ROLES`                 |
| CSS 类名      | kebab-case (Tailwind)| `bg-blue-500`, `flex-row`                     |

### TypeScript 指南

- 始终为函数定义返回类型
- 类型仅导入使用 `import type`
- 启用严格空值检查
- 对象形状使用 `interface`，联合/交集使用 `type`

```typescript
// 良好实践
export interface PlayerData {
  id: number;
  name: string;
  role: PlayerRole;
  position: number;
}

export type Direction = "forward" | "backward";

// 良好实践 - 工厂模式
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
    // ...
    default:
      return new DestinyPlayer(id, name, "destiny", position, cards);
  }
}
```

### 类设计

- 私有字段使用 `_` 前缀
- 提供 getter 用于只读访问
- 需要时使用带验证的 setter
- 实现 `toJSON()` 用于序列化
- 提供静态 `fromData()` 用于反序列化

```typescript
export class Player {
  private _id: number;
  private _position: number;
  private _cards: Card[];

  get id(): number {
    return this._id;
  }
  get position(): number {
    return this._position;
  }
  get cards(): Card[] {
    return [...this._cards];
  } // 返回副本

  set position(newPosition: number) {
    if (newPosition >= 0) {
      this._position = newPosition;
    }
  }

  toJSON(): PlayerData {
    /* ... */
  }

  static fromData(data: PlayerData): Player {
    /* ... */
  }
}
```

### 错误处理

- 抛出带有上下文的描述性错误
- 在构造函数/setter 中验证输入
- 异步操作使用 try-catch

```typescript
// 构造函数/setter 中的验证
if (
  playerCount < GAME_CONFIG.MIN_PLAYERS ||
  playerCount > GAME_CONFIG.MAX_PLAYERS
) {
  throw new Error(
    `玩家数量必须在${GAME_CONFIG.MIN_PLAYERS}-${GAME_CONFIG.MAX_PLAYERS}人之间`,
  );
}

// 方法验证
if (!this._gameStarted || this._players.length === 0) {
  throw new Error("游戏未开始或没有玩家");
}
```

### React 组件指南

- 使用带 hooks 的函数式组件
- 保持组件聚焦（单一职责）
- 复杂逻辑提取到自定义 hooks
- 使用 TypeScript 定义 prop 类型

```typescript
interface DiceRollerProps {
  onRoll: (result: DiceResult) => void;
  disabled?: boolean;
}

export function DiceRoller({ onRoll, disabled = false }: DiceRollerProps) {
  // 组件实现
}
```

### 事件系统

- 使用 `GameEventSystem` 处理游戏事件
- 发布带有结构化 payload 的事件
- 订阅事件以更新 UI

```typescript
// 发布
this.eventSystem.publishEvent({
  type: "GAME_OVER",
  playerId: winner.id,
});

// 订阅
await this._eventSystem.waitForPlayerChoice<PayloadType>({
  type: "PLAYER_ROLE_SELECTION",
  playerId: 1,
  eventData: {
    /* ... */
  },
});
```

### Tailwind CSS

- 使用工具类进行样式
- 优先使用响应式变体 (`md:`, `lg:`)
- 使用一致的颜色调色板 (blue-500, green-500 等)

```tsx
<button
  onClick={handleClick}
  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
>
  点击我
</button>
```

### Three.js / WebGL

- 使用 `Render` 类进行场景管理
- 为 3D 对象创建单独的类（如 `Player3D`）
- 卸载时释放几何体/材质

---

## 项目结构

```
src/
├── components/           # React 组件
│   ├── WebGLBoard.tsx  # 3D 游戏棋盘
│   ├── DiceRoller.tsx  # 骰子 UI
│   ├── PlayerHand.tsx  # 卡牌手牌显示
│   ├── GameEventLayer/ # 事件驱动 UI 覆盖层
│   └── Render.ts       # Three.js 渲染器
├── contexts/            # React contexts
│   └── GameContext.tsx
├── entities/            # 游戏逻辑 (类)
│   ├── Game.ts         # 核心游戏逻辑
│   ├── Player.ts       # 玩家实体
│   ├── Tile.ts         # 格子类型
│   ├── Dice.ts         # 骰子机制
│   ├── CardDeck.ts     # 卡牌堆
│   ├── EventCard.ts    # 事件卡
│   ├── EventCardDeck.ts # 事件卡堆
│   ├── AIPlayer.ts     # AI 玩家
│   ├── GameBoard.ts    # 棋盘生成
│   └── GameEventSystem.ts
├── constants/           # 游戏常量
│   └── game.ts
└── App.tsx             # 根组件
```

---

## 关键模式

1. **工厂模式**：使用 `createPlayer()` 工厂而非直接构造函数
2. **序列化**：实现 `toJSON()` / `fromData()` 用于状态持久化
3. **事件驱动**：使用 `GameEventSystem` 进行异步游戏流程
4. **角色处理器**：玩家实现 `getTileHandlers()` 用于角色特定的格子行为
5. **方向感知移动**：在移动逻辑中处理 `forward` / `backward` 方向

---

## 游戏机制

### 角色系统

6 个独特角色，每个都有特殊能力：

| 角色       | 标识符       | 特殊能力                                      |
| ---------- | ------------ | --------------------------------------------- |
| 天命人     | destiny      | 掷骰子时有概率获得额外点数                     |
| 四妹       | sister_four  | 可查看前方格子信息                             |
| 猪八戒     | pigsy        | 可破坏前方障碍物                               |
| 大鸟姐姐   | big_bird     | 可跳过一定数量格子                             |
| 神偷大盗   | thief        | 路过/停留补给站抽 3 张卡（默认 2 张）          |
| 奶昔大哥   | milkshake    | 补给站额外获得 2 步移动                        |

### 格子类型

| 类型      | 效果                                         |
| --------- | -------------------------------------------- |
| empty     | 无特殊效果                                   |
| treasure  | 抽取一张事件卡                               |
| reverse   | 玩家转向一回合                               |
| supply    | 获得 2 张功能卡                              |
| boss      | 需要足够能量击败 BOSS                         |
| teleport  | 传送至下一个传送门或终点                      |

### 卡牌系统

- **能量卡**：提供 1、3、6 点能量
- **法术卡**：
  - `fix_dice` - 定身术：指定骰子点数
  - `swap_position` - 交换位置
  - `extra_turn` - 额外回合

---

## 添加新功能

### 新增事件类型

1. 在 `GameEventSystem.ts` 中添加新事件类型到 `GameEventType`
2. 在 `GameEventLayer/` 目录下创建对应的事件组件
3. 在 `GameEventLayer.tsx` 中注册新事件

### 新增角色

1. 在 `constants/game.ts` 的 `ROLE_INFO` 中添加角色信息
2. 在 `Player.ts` 中创建角色类并实现 `getTileHandlers()`
3. 在 `createPlayer()` 工厂函数中添加分支

### 新增格子类型

1. 在 `Tile.ts` 中添加新类型到 `TileType`
2. 创建继承 `BaseTile` 的新类
3. 实现 `onPass()` 和 `onStay()` 方法
4. 在 `GameBoard.ts` 中更新地图生成逻辑
