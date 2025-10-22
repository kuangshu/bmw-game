import React, { useState } from "react";
import { useGameContext } from "../../contexts/GameContext";
import type { GameEventData } from "../../entities/GameEventSystem";

export type SpellFixDicePayload = [null, { fixedValue: number }];

interface SpellFixDiceEventProps {
  eventData: GameEventData<SpellFixDicePayload[0]>;
  onComplete: (result: SpellFixDicePayload[1]) => void;
}

const SpellFixDiceEvent: React.FC<SpellFixDiceEventProps> = ({
  onComplete,
}) => {
  const { gameInstance } = useGameContext();
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);

  const handleSubmit = () => {
    if (!gameInstance) {
      onComplete({ fixedValue: 0 });
      return;
    }

    // 计算骰子点数总和
    const totalSteps = dice1 + dice2;

    // 完成事件，返回固定的骰子点数
    onComplete({ fixedValue: totalSteps });

    gameInstance.processSteps(totalSteps);
  };

  const diceSelect = (value: number, setValue: (v: number) => void) => (
    <select
      className="mx-1 border rounded px-2 py-1"
      value={value}
      onChange={(e) => setValue(Number(e.target.value))}
    >
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">定身术：指定下次骰子点数</h2>
      <div className="flex items-center mb-4">
        <span>骰子1:</span>
        {diceSelect(dice1, setDice1)}
        <span>骰子2:</span>
        {diceSelect(dice2, setDice2)}
      </div>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
        onClick={handleSubmit}
      >
        提交
      </button>
    </div>
  );
};

export default SpellFixDiceEvent;
