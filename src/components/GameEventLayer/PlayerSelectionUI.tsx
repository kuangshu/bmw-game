import React, { useState } from "react";
import type { GameEventData } from "../../entities/GameEventSystem";
import type { Player } from "../../entities/Player";

// 玩家选择事件数据类型
export type PlayerSelectionPayload = [
  {
    currentPlayer: Player;
    availablePlayers: Player[];
    description?: string;
    canCancel?: boolean;
  },
  { selectedPlayerId: number | null },
];

interface PlayerSelectionUIProps {
  eventData: GameEventData<PlayerSelectionPayload[0]>;
  onComplete: (result: PlayerSelectionPayload[1]) => void;
}

const PlayerSelectionUI: React.FC<PlayerSelectionUIProps> = ({
  eventData,
  onComplete,
}) => {
  const { availablePlayers, description, canCancel } =
    eventData.eventData || {};
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const handlePlayerSelect = (playerId: number) => {
    // 如果点击的是已选中的玩家，则取消选择
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    } else {
      // 否则选择该玩家
      setSelectedPlayerId(playerId);
    }
  };

  const handleConfirm = () => {
    onComplete({ selectedPlayerId });
  };

  const handleCancel = () => {
    onComplete({ selectedPlayerId: null });
  };

  return (
    <div className="bg-white rounded-lg p-6 min-w-[320px] max-w-md mx-4">
      <h2 className="font-bold text-xl mb-4 text-center">选择玩家</h2>

      {description && (
        <p className="text-gray-600 text-sm mb-4">{description}</p>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
        {availablePlayers?.map((player) => (
          <div
            key={player.id}
            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
              selectedPlayerId === player.id
                ? "border-blue-500 bg-blue-50"
                : "border-transparent hover:border-gray-300"
            }`}
            onClick={() => handlePlayerSelect(player.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{player.name}</h3>
                <p className="text-xs text-gray-600">
                  手牌数量: {player.cards.length}张
                </p>
              </div>
              {selectedPlayerId === player.id && (
                <span className="text-blue-500 text-sm">✓ 已选择</span>
              )}
            </div>
          </div>
        ))}

        {availablePlayers?.length === 0 && (
          <div className="text-center py-4 text-gray-500">没有可选择的玩家</div>
        )}
      </div>

      <div className="flex justify-center space-x-3">
        <button
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedPlayerId !== null
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          onClick={handleConfirm}
          disabled={selectedPlayerId === null}
        >
          确认选择
        </button>
        {canCancel && (
          <button
            className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            onClick={handleCancel}
          >
            放弃选择
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerSelectionUI;
