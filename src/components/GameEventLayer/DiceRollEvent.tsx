import React, { useState } from "react";
import type { GameEventData } from "../../entities/GameEventSystem";
import { Dice, DiceResult } from "../../entities/Dice";

// 掷骰子事件数据类型
export type DiceRollPayload = [
  {
    player: {
      id: number;
      name: string;
    };
    description?: string;
  },
  { diceResult: DiceResult },
];

interface DiceRollEventProps {
  eventData: GameEventData<DiceRollPayload[0]>;
  onComplete: (result: DiceRollPayload[1]) => void;
}

const DiceRollEvent: React.FC<DiceRollEventProps> = ({
  eventData,
  onComplete,
}) => {
  const { player, description } = eventData.eventData || {};
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const dice = new Dice();

  const handleRollDice = async () => {
    if (isRolling) return;

    setIsRolling(true);
    try {
      // 模拟掷骰子延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 生成骰子结果
      const result = await dice.roll();
      setDiceResult(result);

      // 自动完成事件
      setTimeout(() => {
        onComplete({ diceResult: result });
      }, 1500);
    } catch (error) {
      console.error("掷骰子时出错:", error);
      // 即使出错也完成事件，避免卡住游戏流程
      onComplete({ diceResult: { dice1: 1, dice2: 1, total: 2 } });
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 min-w-[320px] max-w-md mx-4">
      <h2 className="font-bold text-xl mb-4 text-center">掷骰子对决</h2>

      {description && (
        <p className="text-gray-600 text-sm mb-4 text-center">{description}</p>
      )}

      <div className="mb-6">
        <p className="text-center text-gray-700 mb-4">
          玩家 <span className="font-semibold">{player?.name}</span> 请掷骰子
        </p>
      </div>

      <div className="flex justify-center space-x-4 mb-6">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl transition-all duration-300 ${
            isRolling ? "animate-spin bg-gray-400" : "bg-red-500"
          }`}
        >
          {diceResult?.dice1 || "?"}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl transition-all duration-300 ${
            isRolling ? "animate-spin bg-gray-400" : "bg-blue-500"
          }`}
        >
          {diceResult?.dice2 || "?"}
        </div>
      </div>

      {diceResult && (
        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-gray-800">
            总计: {diceResult.total}
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleRollDice}
          disabled={isRolling || !!diceResult}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isRolling || !!diceResult
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {isRolling ? "掷骰子中..." : diceResult ? "已完成" : "掷骰子"}
        </button>
      </div>
    </div>
  );
};

export default DiceRollEvent;
