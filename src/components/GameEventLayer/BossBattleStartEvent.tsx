import React from 'react';
import type { GameEventData } from '../../entities/GameEventSystem';

// BOSS战斗开始事件数据类型
interface BossBattleStartEventData {
  // 可以添加特定于BOSS战斗开始事件的属性
}

interface BossBattleStartEventProps {
  eventData: GameEventData<BossBattleStartEventData>;
  onComplete: (result: { started: boolean }) => void;
}

const BossBattleStartEvent: React.FC<BossBattleStartEventProps> = ({ onComplete }) => {
  // 由于移除了bossBattleData属性，这里需要从其他地方获取需求信息
  // 暂时使用默认值，实际应用中应该从游戏状态中获取
  const requirement = 5;
  
  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">BOSS战斗开始</h2>
      <p className="mb-4">需要收集 {requirement} 点能量才能击败BOSS！</p>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
        onClick={() => onComplete({ started: true })}
      >
        开始战斗
      </button>
    </div>
  );
};

export default BossBattleStartEvent;
