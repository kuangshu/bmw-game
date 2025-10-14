import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
// 模拟卡片数据
const generateInitialCards = () => {
    const cards = [];
    // 能量卡
    for (let i = 1; i <= 3; i++) {
        cards.push({
            id: i,
            type: 'energy',
            value: i * 2, // 2, 4, 6
            description: `提供 ${i * 2} 点能量`
        });
    }
    // 法术卡
    cards.push({
        id: 4,
        type: 'spell',
        value: 0,
        effect: 'double_move',
        description: '下次移动距离翻倍'
    });
    return cards;
};
const PlayerHand = ({ player, gameState, setGameState }) => {
    const useCard = (card) => {
        if (card.type === 'energy') {
            // 使用能量卡
            const updatedPlayers = gameState.players.map(p => p.id === player.id
                ? { ...p, energy: p.energy + card.value, cards: p.cards.filter(c => c.id !== card.id) }
                : p);
            setGameState({
                ...gameState,
                players: updatedPlayers
            });
        }
        else if (card.type === 'spell') {
            // 使用法术卡（这里可以扩展具体效果）
            alert(`使用法术卡: ${card.description}`);
            const updatedPlayers = gameState.players.map(p => p.id === player.id
                ? { ...p, cards: p.cards.filter(c => c.id !== card.id) }
                : p);
            setGameState({
                ...gameState,
                players: updatedPlayers
            });
        }
    };
    // 初始化玩家手牌（如果还没有）
    React.useEffect(() => {
        if (player.cards.length === 0) {
            const initialCards = generateInitialCards();
            const updatedPlayers = gameState.players.map(p => p.id === player.id ? { ...p, cards: initialCards } : p);
            setGameState({
                ...gameState,
                players: updatedPlayers
            });
        }
    }, [player.id]);
    return (_jsxs("div", { className: "bg-white p-4 rounded-lg shadow-md", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4", children: [player.name, "\u7684\u624B\u724C"] }), _jsxs("div", { className: "mb-4", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u80FD\u91CF: " }), _jsx("span", { className: "font-bold text-green-600", children: player.energy })] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: player.cards.map(card => (_jsxs("button", { onClick: () => useCard(card), className: `p-2 rounded text-xs text-left ${card.type === 'energy'
                        ? 'bg-yellow-100 hover:bg-yellow-200 border border-yellow-300'
                        : 'bg-blue-100 hover:bg-blue-200 border border-blue-300'}`, children: [_jsx("div", { className: "font-semibold", children: card.type === 'energy' ? '能量卡' : '法术卡' }), _jsx("div", { className: "text-gray-600", children: card.description })] }, card.id))) }), player.cards.length === 0 && (_jsx("div", { className: "text-center text-gray-500 text-sm py-4", children: "\u6682\u65E0\u624B\u724C" }))] }));
};
export default PlayerHand;
