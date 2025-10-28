import React, { useEffect } from "react";
import { useGameContext } from "../../contexts/GameContext";
import type { GameEventData } from "../../entities/GameEventSystem";

export type SpellExtraTurnPayload = [null, null];

interface SpellExtraTurnEventProps {
  eventData: GameEventData<SpellExtraTurnPayload[0]>;
  onComplete: (result: SpellExtraTurnPayload[1]) => void;
}

const SpellExtraTurnEvent: React.FC<SpellExtraTurnEventProps> = ({
  onComplete,
}) => {
  const { gameInstance } = useGameContext();

  useEffect(() => {
    if (!gameInstance) {
      onComplete(null);
      return;
    }

    // 获取当前最大投掷次数并增加1
    const currentMaxRolls = gameInstance.getMaxDiceRolls();
    const newMaxRolls = currentMaxRolls + 1;

    // 更新游戏状态为当前最大投掷次数+1
    gameInstance.setMaxDiceRolls(newMaxRolls);

    // 完成事件，返回更新后的最大投掷次数
    onComplete(null);
  }, [gameInstance, onComplete]);

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">额外回合</h2>
      <p className="mb-4">使用额外回合法术卡，本回合可多投掷一次骰子</p>
      <div className="text-sm text-gray-600 mb-4">
        当前最大投掷次数: {gameInstance ? gameInstance.getMaxDiceRolls() : 1}
      </div>
      <div className="text-xs text-gray-500">
        使用后最大投掷次数将增加为:{" "}
        {gameInstance ? gameInstance.getMaxDiceRolls() + 1 : 2}
      </div>
    </div>
  );
};

export default SpellExtraTurnEvent;
