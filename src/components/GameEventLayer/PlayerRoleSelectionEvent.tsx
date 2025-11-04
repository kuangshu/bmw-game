import React, { useState, useEffect } from "react";
import type { GameEventData } from "../../entities/GameEventSystem";
import { ROLE_INFO } from "../../constants/game";
import { PlayerRole } from "../../entities";

// 角色选择事件数据类型
export type PlayerRoleSelectionPayload = [
  {
    playerNumber: number;
    availableRoles: PlayerRole[];
    selectedRoles: PlayerRole[];
    totalPlayers: number;
    aiPlayerCount?: number; // AI玩家人数
  },
  {
    playerSelections: Array<{
      playerIndex: number; // 玩家索引 (0-based)
      isAI: boolean; // 是否为AI玩家
      role: PlayerRole; // 选择的角色
    }>;
  },
];

interface PlayerRoleSelectionEventProps {
  eventData: GameEventData<PlayerRoleSelectionPayload[0]>;
  onComplete: (result: PlayerRoleSelectionPayload[1]) => void;
}

// 角色信息配置（使用常量文件中的配置）
const roleInfo = ROLE_INFO;

const PlayerRoleSelectionEvent: React.FC<PlayerRoleSelectionEventProps> = ({
  eventData,
  onComplete,
}) => {
  const [selectedRole, setSelectedRole] = useState<PlayerRole>();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [allSelections, setAllSelections] = useState<
    Array<{
      playerIndex: number;
      isAI: boolean;
      role: PlayerRole;
    }>
  >([]);

  const { availableRoles, totalPlayers, aiPlayerCount } =
    eventData.eventData || {};

  // AI玩家自动选择角色
  const handleAIPlayerSelection = () => {
    if (!availableRoles || !totalPlayers || !aiPlayerCount) return;

    const humanPlayerCount = totalPlayers - aiPlayerCount;

    // 如果当前是AI玩家选择阶段，自动选择角色
    if (
      currentPlayerIndex >= humanPlayerCount &&
      currentPlayerIndex < totalPlayers
    ) {
      // 从可用角色中随机选择一个
      const remainingRoles = availableRoles.filter(
        (role) => !allSelections.some((selection) => selection.role === role)
      );
      if (remainingRoles.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingRoles.length);
        const aiSelectedRole = remainingRoles[randomIndex];

        // 模拟AI选择角色
        setTimeout(() => {
          const newSelections = [
            ...allSelections,
            {
              playerIndex: currentPlayerIndex,
              isAI: true,
              role: aiSelectedRole,
            },
          ];
          setAllSelections(newSelections);

          // 如果所有玩家都选择完成，则一次性完成事件
          if (newSelections.length >= totalPlayers) {
            onComplete({ playerSelections: newSelections });
          } else {
            // 切换到下一个玩家
            const nextPlayerIndex = currentPlayerIndex + 1;
            setCurrentPlayerIndex(nextPlayerIndex);

            // 直接判断下一个玩家是否为AI，如果是则调用AI选择函数
            if (
              nextPlayerIndex >= humanPlayerCount &&
              nextPlayerIndex < totalPlayers
            ) {
              handleAIPlayerSelection();
            }
          }
        }, 1000); // 延迟1秒，让用户看到AI选择的过程
      }
    }
  };

  // 当组件挂载时，重置状态
  useEffect(() => {
    setCurrentPlayerIndex(0);
    setAllSelections([]);
    setSelectedRole(undefined);

    // 检查第一个玩家是否为AI
    if (totalPlayers && aiPlayerCount) {
      const humanPlayerCount = totalPlayers - aiPlayerCount;
      if (0 >= humanPlayerCount && 0 < totalPlayers) {
        // 第一个玩家是AI，调用AI选择函数
        setTimeout(() => {
          handleAIPlayerSelection();
        }, 500); // 短暂延迟确保状态已更新
      }
    }
  }, []);

  const handleRoleSelect = (role: PlayerRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = () => {
    if (selectedRole && totalPlayers) {
      const newSelections = [
        ...allSelections,
        {
          playerIndex: currentPlayerIndex,
          isAI: false,
          role: selectedRole,
        },
      ];
      setAllSelections(newSelections);

      // 如果所有玩家都选择完成，则一次性完成事件
      if (newSelections.length >= totalPlayers) {
        onComplete({ playerSelections: newSelections });
      } else {
        // 切换到下一个玩家
        const nextPlayerIndex = currentPlayerIndex + 1;
        setCurrentPlayerIndex(nextPlayerIndex);
        setSelectedRole(undefined);

        // 直接判断下一个玩家是否为AI，如果是则调用AI选择函数
        const humanPlayerCount = totalPlayers - (aiPlayerCount || 0);
        if (
          nextPlayerIndex >= humanPlayerCount &&
          nextPlayerIndex < totalPlayers
        ) {
          handleAIPlayerSelection();
        }
      }
    }
  };

  const currentPlayerNumber = currentPlayerIndex + 1;
  const isAIPlayer =
    totalPlayers &&
    aiPlayerCount &&
    currentPlayerIndex >= totalPlayers - aiPlayerCount;

  return (
    <div className="bg-white rounded-lg p-6 min-w-[320px] max-w-md mx-4">
      <h2 className="font-bold text-xl mb-4 text-center">
        角色选择 ({currentPlayerNumber}/{totalPlayers})
        {isAIPlayer && (
          <span className="ml-2 text-sm text-blue-600">(AI玩家)</span>
        )}
      </h2>

      <div className="mb-4">
        <p className="text-gray-600 text-sm mb-2">
          请为玩家 {currentPlayerNumber} 选择一个角色：
          {isAIPlayer && (
            <span className="ml-1 text-blue-600">AI正在思考...</span>
          )}
        </p>

        {allSelections.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">已选择的角色：</p>
            <div className="flex flex-wrap gap-1">
              {allSelections.map((selection, index) => (
                <span
                  key={`${selection.role}-${index}`}
                  className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700"
                >
                  {selection.isAI
                    ? `AI玩家`
                    : `玩家${selection.playerIndex + 1}`}
                  :{" "}
                  {roleInfo[selection.role as keyof typeof roleInfo]?.name ||
                    selection.role}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {availableRoles?.map((role) => {
          const info = roleInfo[role as keyof typeof roleInfo];
          if (!info) return null;

          // 检查角色是否已被选择
          const isRoleSelected = allSelections.some(
            (selection) => selection.role === role
          );
          // 获取选择此角色的玩家信息
          const playerSelection = allSelections.find(
            (selection) => selection.role === role
          );

          return (
            <div
              key={role}
              className={`p-3 border-2 rounded-lg transition-all ${
                selectedRole === role
                  ? "border-blue-500 bg-blue-50"
                  : isRoleSelected
                    ? "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed"
                    : `${info.color} border-transparent hover:border-gray-300 cursor-pointer`
              }`}
              onClick={() => !isRoleSelected && handleRoleSelect(role)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{info.name}</h3>
                {selectedRole === role && (
                  <span className="text-blue-500 text-sm">✓ 已选择</span>
                )}
              </div>
              <p className="text-xs text-gray-600">{info.description}</p>

              {/* 显示选择此角色的玩家信息 */}
              {isRoleSelected && playerSelection && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    已被{" "}
                    {playerSelection.isAI
                      ? `AI玩家`
                      : `玩家${playerSelection.playerIndex + 1}`}{" "}
                    选择
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {availableRoles?.length === 0 && (
          <div className="text-center py-4 text-gray-500">没有可用的角色了</div>
        )}
      </div>

      {!isAIPlayer && (
        <div className="mt-6 flex justify-center">
          <button
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedRole
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            onClick={handleSubmit}
            disabled={!selectedRole}
          >
            确认选择
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerRoleSelectionEvent;
