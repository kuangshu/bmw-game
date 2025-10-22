import React, { useState, useEffect } from 'react';
import type { GameEventData } from '../../entities/GameEventSystem';
import { ROLE_INFO } from '../../constants/game';

// 角色选择事件数据类型
interface PlayerRoleSelectionEventData {
  playerNumber: number;
  availableRoles: string[];
  selectedRoles: string[];
  totalPlayers: number;
}

interface PlayerRoleSelectionEventProps {
  eventData: GameEventData<PlayerRoleSelectionEventData>;
  onComplete: (result: { selectedRoles: string[] }) => void;
}

// 角色信息配置（使用常量文件中的配置）
  const roleInfo = ROLE_INFO;

const PlayerRoleSelectionEvent: React.FC<PlayerRoleSelectionEventProps> = ({ 
  eventData, 
  onComplete 
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [allSelectedRoles, setAllSelectedRoles] = useState<string[]>([]);
  
  const { availableRoles, totalPlayers } = eventData.eventData || {};

  // 当组件挂载时，重置状态
  useEffect(() => {
    setCurrentPlayerIndex(0);
    setAllSelectedRoles([]);
    setSelectedRole('');
  }, []);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const handleSubmit = () => {
    if (selectedRole && totalPlayers) {
      const newSelectedRoles = [...allSelectedRoles, selectedRole];
      setAllSelectedRoles(newSelectedRoles);
      
      // 如果所有玩家都选择完成，则一次性完成事件
      if (newSelectedRoles.length >= totalPlayers) {
        onComplete({ selectedRoles: newSelectedRoles });
      } else {
        // 切换到下一个玩家
        setCurrentPlayerIndex(currentPlayerIndex + 1);
        setSelectedRole('');
      }
    }
  };

  const currentPlayerNumber = currentPlayerIndex + 1;

  return (
    <div className="bg-white rounded-lg p-6 min-w-[320px] max-w-md mx-4">
      <h2 className="font-bold text-xl mb-4 text-center">
        角色选择 ({currentPlayerNumber}/{totalPlayers})
      </h2>
      
      <div className="mb-4">
        <p className="text-gray-600 text-sm mb-2">
          请为玩家 {currentPlayerNumber} 选择一个角色：
        </p>
        
        {allSelectedRoles.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">已选择的角色：</p>
            <div className="flex flex-wrap gap-1">
              {allSelectedRoles.map((role, index) => (
                <span 
                  key={`${role}-${index}`}
                  className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700"
                >
                  玩家{index + 1}: {roleInfo[role as keyof typeof roleInfo]?.name || role}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {availableRoles?.map(role => {
          const info = roleInfo[role as keyof typeof roleInfo];
          if (!info) return null;
          
          return (
            <div
              key={role}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === role 
                  ? 'border-blue-500 bg-blue-50' 
                  : `${info.color} border-transparent hover:border-gray-300`
              }`}
              onClick={() => handleRoleSelect(role)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{info.name}</h3>
                {selectedRole === role && (
                  <span className="text-blue-500 text-sm">✓ 已选择</span>
                )}
              </div>
              <p className="text-xs text-gray-600">{info.description}</p>
            </div>
          );
        })}
        
        {availableRoles?.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            没有可用的角色了
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedRole
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          onClick={handleSubmit}
          disabled={!selectedRole}
        >
          确认选择
        </button>
      </div>
    </div>
  );
};

export default PlayerRoleSelectionEvent;