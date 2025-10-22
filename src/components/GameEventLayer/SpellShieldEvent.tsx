import React from 'react';
import type { GameEventData } from "../../entities/GameEventSystem";

// 护盾法术事件数据类型
interface SpellShieldEventData {
  // 可以添加特定于护盾法术事件的属性
}

interface SpellShieldEventProps {
  eventData: GameEventData<SpellShieldEventData>;
  onComplete: (result: { shieldValue: number }) => void;
}

const SpellShieldEvent: React.FC<SpellShieldEventProps> = ({ onComplete }) => {
  const handleSubmit = () => {
    onComplete({ shieldValue: 10 });
  };

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">护盾</h2>
      <p className="mb-4">使用护盾法术卡</p>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
        onClick={handleSubmit}
      >
        确认使用
      </button>
    </div>
  );
};

export default SpellShieldEvent;
