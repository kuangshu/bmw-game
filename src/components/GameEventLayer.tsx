import React, { useEffect, useState } from 'react';
import { useGameContext } from "../contexts/GameContext";
import type { GameEventData, GameEventType } from "../entities/GameEventSystem";
import type { Card } from "../entities";

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

// BOSS战斗开始事件组件
const BossBattleStartEvent: React.FC<{ eventData: GameEventData; onComplete: (result: any) => void }> = ({ eventData, onComplete }) => {
  const { bossBattleData } = eventData || {};
  const { requirement = 0 } = bossBattleData || {};
  
  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">BOSS战斗开始</h2>
      <p className="mb-4">需要收集 {requirement} 点能量才能击败BOSS！</p>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
        onClick={() => onComplete({ ready: true })}
      >
        开始战斗
      </button>
    </div>
  );
};

// BOSS战斗出牌事件组件
const BossBattlePlayCardsEvent: React.FC<{ eventData: GameEventData; onComplete: (result: any) => void }> = ({ eventData, onComplete }) => {
  const { gameInstance } = useGameContext();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const player = gameInstance?.getCurrentPlayer();
  const { bossBattleData } = eventData || {};
  const { requirement = 0 } = bossBattleData || {};
  
  const handleCardSelect = (cardId: number) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId) 
        : [...prev, cardId]
    );
  };
  
  const handlePlayCards = () => {
    onComplete({ playCards: true, cardIds: selectedCards });
  };
  
  const handleDiscard = () => {
    onComplete({ discard: true });
  };
  
  // 计算选中卡片的总能量
  const calculateTotalEnergy = () => {
    let total = 0;
    selectedCards.forEach(cardId => {
      const card = player?.getCard(cardId);
      if (card && card.type === "energy") {
        total += card.value;
      }
    });
    return total;
  };
  
  const totalEnergy = calculateTotalEnergy();
  const hasEnoughEnergy = totalEnergy >= requirement;
  
  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">BOSS战斗 - 出牌</h2>
      <p className="mb-4">需要 {requirement} 点能量，当前已选：{totalEnergy} 点</p>
      
      <div className="grid grid-cols-3 gap-2 mb-4 w-full">
        {player?.cards.map((card: Card) => (
          <button
            key={card.id}
            className={`p-2 border rounded ${selectedCards.includes(card.id) ? 'bg-blue-200 border-blue-500' : 'bg-white border-gray-300'}`}
            onClick={() => handleCardSelect(card.id)}
          >
            <div>{card.name}</div>
            <div className="text-sm">{card.type === 'energy' ? `能量: ${card.value}` : '法术卡'}</div>
          </button>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button
          className={`bg-green-500 hover:bg-green-600 text-white rounded px-4 py-2 ${!hasEnoughEnergy && selectedCards.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handlePlayCards}
          disabled={!hasEnoughEnergy && selectedCards.length > 0}
        >
          出牌攻击
        </button>
        <button
          className="bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2"
          onClick={handleDiscard}
        >
          弃牌撤退
        </button>
      </div>
    </div>
  );
};

// BOSS战斗弃牌撤退事件组件
const BossBattleDiscardEvent: React.FC<{ eventData: GameEventData; onComplete: (result: any) => void }> = ({ onComplete }) => {
  const { gameInstance } = useGameContext();
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  
  const player = gameInstance?.getCurrentPlayer();
  
  const handleDiscardCard = () => {
    if (selectedCardId !== null) {
      onComplete({ discardedCardId: selectedCardId });
    }
  };
  
  return (
    <div className="bg-white rounded-lg p-4 min-w-[290px] flex flex-col items-center">
      <h2 className="font-bold text-lg mb-4">BOSS战斗 - 弃牌撤退</h2>
      <p className="mb-4">请选择一张卡片弃掉以撤退</p>
      
      <div className="grid grid-cols-3 gap-2 mb-4 w-full">
        {player?.cards.map((card: Card) => (
          <button
            key={card.id}
            className={`p-2 border rounded ${selectedCardId === card.id ? 'bg-red-200 border-red-500' : 'bg-white border-gray-300'}`}
            onClick={() => setSelectedCardId(card.id)}
          >
            <div>{card.name}</div>
            <div className="text-sm">{card.type === 'energy' ? `能量: ${card.value}` : '法术卡'}</div>
          </button>
        ))}
      </div>
      
      <button
        className={`bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2 ${selectedCardId === null ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleDiscardCard}
        disabled={selectedCardId === null}
      >
        确认弃牌撤退
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

    const eventSystem = gameInstance.eventSystem;
    
    // 初始检查是否有待处理的事件
    const checkInitialEvent = () => {
      const pendingEvent = eventSystem.getPendingEvent();
      if (pendingEvent) {
        setCurrentEvent(pendingEvent);
      }
    };
    
    // 订阅所有可能的事件类型
    const handleNewEvent = (eventData: GameEventData) => {
      setCurrentEvent(eventData);
    };
    
    // 订阅所有相关事件类型
    const eventTypes: GameEventType[] = [
      "SPELL_FIX_DICE",
      "SPELL_SWAP_POSITION",
      "SPELL_EXTRA_TURN",
      "SPELL_SHIELD",
      "BOSS_BATTLE_START",
      "BOSS_BATTLE_PLAY_CARDS",
      "BOSS_BATTLE_DISCARD",
      "TILE_TREASURE",
      "TILE_REVERSE",
      "TILE_SUPPLY",
      "TILE_TELEPORT",
      "GAME_OVER",
      "TURN_END",
      "PLAYER_CHOICE",
      "CUSTOM"
    ];
    
    // 为每个事件类型订阅处理函数
    eventTypes.forEach(type => {
      eventSystem.subscribe(type, handleNewEvent);
    });
    
    // 初始检查
    checkInitialEvent();

    // 清理订阅
    return () => {
      eventTypes.forEach(type => {
        eventSystem.unsubscribe(type, handleNewEvent);
      });
    };
  }, [gameInstance]);

  // 处理事件完成
  const handleEventComplete = (result: any) => {
    if (!gameInstance || !currentEvent) return;
    
    // 通知事件系统事件已完成
    // 使用事件的时间戳作为临时的事件ID
    // 在实际应用中，应该确保有正确的事件ID机制
    const eventId = `event_${currentEvent.timestamp}`;
    gameInstance.eventSystem.completeEvent(eventId, result);
    
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
      case "BOSS_BATTLE_PLAY_CARDS":
        return <BossBattlePlayCardsEvent eventData={currentEvent} onComplete={handleEventComplete} />;
      case "BOSS_BATTLE_DISCARD":
        return <BossBattleDiscardEvent eventData={currentEvent} onComplete={handleEventComplete} />;
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