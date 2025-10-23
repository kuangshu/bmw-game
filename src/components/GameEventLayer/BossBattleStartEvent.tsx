import React, { useEffect } from "react";
import type { GameEventData } from "../../entities/GameEventSystem";

// BOSS战斗开始事件数据类型
export type BossBattleStartPayload = [
  { requirement: number },
  { ready: boolean },
];

interface BossBattleStartEventProps {
  eventData: GameEventData<BossBattleStartPayload[0]>;
  onComplete: (result: BossBattleStartPayload[1]) => void;
}

const BossBattleStartEvent: React.FC<BossBattleStartEventProps> = ({
  eventData,
  onComplete,
}) => {
  useEffect(() => {
    // TODO BOSS出场演出
    setTimeout(() => {
      onComplete({ ready: true });
    }, 1000);
  }, []);

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">BOSS战斗开始</h2>
      <p className="mb-4">需要提供 {eventData?.eventData?.requirement || 0} 点能量才能击败BOSS！</p>
    </div>
  );
};

export default BossBattleStartEvent;
