// 骰子结果接口
export interface DiceResult {
  dice1: number;
  dice2: number;
  total: number;
}

// 骰子实体类
export class Dice {
  private _result: DiceResult | null = null;
  private _isRolling: boolean = false;
  private _rollCount: number = 0;
  private _maxRolls: number = 1;

  // 获取当前骰子结果
  get result(): DiceResult | null {
    return this._result;
  }

  // 获取是否正在摇骰子
  get isRolling(): boolean {
    return this._isRolling;
  }

  // 获取当前摇骰子次数
  get rollCount(): number {
    return this._rollCount;
  }

  // 获取最大摇骰子次数
  get maxRolls(): number {
    return this._maxRolls;
  }

  // 设置最大摇骰子次数
  setMaxRolls(maxRolls: number): void {
    this._maxRolls = maxRolls;
  }

  // 重置摇骰子次数
  resetRollCount(): void {
    this._rollCount = 0;
  }

  // 增加摇骰子次数
  incrementRollCount(): void {
    this._rollCount++;
  }

  // 检查是否可以摇骰子
  canRoll(): boolean {
    return this._rollCount < this._maxRolls && !this._isRolling;
  }

  // 开始摇骰子
  roll(): Promise<DiceResult> {
    return new Promise((resolve) => {
      if (!this.canRoll()) {
        throw new Error("当前不能摇骰子");
      }

      this._isRolling = true;

      // 模拟摇骰子动画时间
      setTimeout(() => {
        // 生成骰子结果
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;

        this._result = {
          dice1,
          dice2,
          total,
        };

        this._isRolling = false;
        this.incrementRollCount();

        resolve(this._result);
      }, 1000);
    });
  }

  // 设置骰子结果（用于测试或特殊情况）
  setResult(result: DiceResult): void {
    this._result = result;
  }

  // 重置骰子状态
  reset(): void {
    this._result = null;
    this._isRolling = false;
    this._rollCount = 0;
    this._maxRolls = 1;
  }

  // 序列化方法
  toJSON(): { result: DiceResult | null; rollCount: number; maxRolls: number } {
    return {
      result: this._result,
      rollCount: this._rollCount,
      maxRolls: this._maxRolls,
    };
  }

  // 从数据创建Dice实例
  static fromData(data: {
    result: DiceResult | null;
    rollCount: number;
    maxRolls: number;
  }): Dice {
    const dice = new Dice();
    dice._result = data.result;
    dice._rollCount = data.rollCount;
    dice._maxRolls = data.maxRolls;
    return dice;
  }
}
