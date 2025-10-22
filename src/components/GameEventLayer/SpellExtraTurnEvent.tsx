import React from 'react';
import type { GameEventData } from "../../entities/GameEventSystem";

interface SpellExtraTurnEventProps {
  eventData: GameEventData;
  onComplete: (result: any) => void;
}

const SpellExtraTurnEvent: React.FC<SpellExtraTurnEventProps> = ({ onComplete }) => {
  const handleSubmit = () => {
    onComplete({ extraTurn: true });
  };

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">额外投掷</h2>
      <p className="mb-4">使用法术卡，在当前回合获得额外一次骰子投掷机会</p>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
        onClick={handleSubmit}
      >
        确认使用
      </button>
    </div>
  );
};

export default SpellExtraTurnEvent;
