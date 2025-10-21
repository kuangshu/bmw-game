import React, { useEffect, useState } from "react";
import { useGameContext } from "../contexts/GameContext";
import type { GameEventData } from "../entities/GameEventSystem";

// 法术卡事件组件
const SpellFixDiceEvent: React.FC<{ eventData: GameEventData; onComplete: (result: any) => void }> = ({ onComplete }) => {
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);

  const handleSubmit = () => {
    onComplete({ fixedValue: dice1 + dice2 });
  };

  const diceSelect = (value: number, setValue: (v: number) => void) => (
    <select
      className="mx-1 border rounded px-2 py-1"
      value={value}
      onChange={e => setValue(Number(e.target.value))}
    >
      {[1, 2, 3, 4, 5, 6].map(n => (
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

const SpellSwapPositionEvent: React.FC<{ eventData: GameEventData; onComplete: (result: any) => void }> = ({ onComplete }) => {
  const { gameInstance } = useGameContext();
  const [targetPlayerId, setTargetPlayerId] = useState<number | null>(null);

  if (!gameInstance) return null;

  const gameState = gameInstance.toJSON();
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const handleSubmit = () => {
    if (targetPlayerId !== null) {
      onComplete({ targetPlayerId });
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">交换位置：选择要交换位置的玩家</h2>
      <div className="space-y-2 w-full">
        {gameState.players
          .filter(player => player.id !== currentPlayer.id)
          .map(player => (
            <div
              key={player.id}
              className={`p-2 rounded cursor-pointer ${
                targetPlayerId === player.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setTargetPlayerId(player.id)}
            >
              {player.name}
            </div>
          ))}
      </div>
      <button
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 disabled:bg-gray-400"
        onClick={handleSubmit}
        disabled={targetPlayerId === null}
      >
        确认交换
      </button>
    </div>
  );
};

const SpellExtraTurnEvent: React.FC<{ eventData: GameEventData; onComplete: (result: any) => void }> = ({ onComplete }) => {
  const handleSubmit = () => {
    onComplete({ extraTurn: true });
  };

  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">额外回合</h2>
      <p className="mb-4">使用额外回合法术卡</p>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
        onClick={handleSubmit}
      >
        确认使用
      </button>
    </div>
  );
};

const SpellShieldEvent: React.FC<{ eventData: GameEventData; onComplete: (result: any) => void }> = ({ onComplete }) => {
  const handleSubmit = () => {
    onComplete({ shield: true });
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

// BOSS战斗事件组件
const BossBattleStartEvent: React.FC<{ eventData: GameEventData; onComplete: (result: any) => void }> = ({ onComplete }) => {
  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">BOSS战斗开始</h2>
      <p className="mb-4">准备进入BOSS战斗</p>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
        onClick={() => onComplete({ ready: true })}
      >
        开始战斗
      </button>
    </div>
  );
};

// 游戏事件层组件
const GameEventLayer: React.FC = () => {
  const { gameInstance } = useGameContext();
  const [currentEvent, setCurrentEvent] = useState<GameEventData | null>(null);

  useEffect(() => {
    if (!gameInstance) return;

    // 监听事件系统中的新事件
    const eventSystem = gameInstance.eventSystem;
    
    // 检查是否有待处理的事件
    const checkPendingEvent = () => {
      const pendingEvent = eventSystem.getPendingEvent();
      if (pendingEvent) {
        setCurrentEvent(pendingEvent);
      }
    };

    // 定期检查待处理事件
    const interval = setInterval(checkPendingEvent, 100);
    
    // 初始检查
    checkPendingEvent();

    return () => {
      clearInterval(interval);
    };
  }, [gameInstance]);

  // 处理事件完成
  const handleEventComplete = (_result: any) => {
    if (!gameInstance || !currentEvent) return;
    
    // 通知事件系统事件已完成
    // 这里需要一个事件ID来完成事件，暂时用时间戳作为标识
    // 在实际实现中，应该使用真实的事件ID
    
    // 移除已处理的事件
    gameInstance.eventSystem.removeProcessedEvent();
    
    // 清除当前事件
    setCurrentEvent(null);
  };

  if (!currentEvent) return null;

  // 根据事件类型渲染对应的UI组件
  const renderEventUI = () => {
    switch (currentEvent.type) {
      case "SPELL_FIX_DICE":
        return <SpellFixDiceEvent eventData={currentEvent} onComplete={handleEventComplete} />;
      case "SPELL_SWAP_POSITION":
        return <SpellSwapPositionEvent eventData={currentEvent} onComplete={handleEventComplete} />;
      case "SPELL_EXTRA_TURN":
        return <SpellExtraTurnEvent eventData={currentEvent} onComplete={handleEventComplete} />;
      case "SPELL_SHIELD":
        return <SpellShieldEvent eventData={currentEvent} onComplete={handleEventComplete} />;
      case "BOSS_BATTLE_START":
        return <BossBattleStartEvent eventData={currentEvent} onComplete={handleEventComplete} />;
      default:
        return (
          <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
            <h2 className="font-bold text-lg mb-4">未知事件</h2>
            <p className="mb-4">无法处理此事件类型: {currentEvent.type}</p>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
              onClick={() => handleEventComplete({})}
            >
              关闭
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      {renderEventUI()}
    </div>
  );
};

export default GameEventLayer;
