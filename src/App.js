import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import DiceRoller from './components/DiceRoller';
import PlayerHand from './components/PlayerHand';
const initialGameState = {
    players: [],
    currentPlayerIndex: 0,
    gameStarted: false,
    gameOver: false,
    winner: null
};
function App() {
    const [gameState, setGameState] = useState(initialGameState);
    const [orientation, setOrientation] = useState('portrait');
    const [isMobile, setIsMobile] = useState(false);
    // 检测设备和屏幕方向
    useEffect(() => {
        const checkDeviceAndOrientation = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
        };
        checkDeviceAndOrientation();
        window.addEventListener('resize', checkDeviceAndOrientation);
        return () => window.removeEventListener('resize', checkDeviceAndOrientation);
    }, []);
    // 初始化游戏
    const initializeGame = (playerCount) => {
        const players = Array.from({ length: playerCount }, (_, index) => ({
            id: index + 1,
            name: `玩家 ${index + 1}`,
            position: 0,
            cards: [],
            energy: 0
        }));
        setGameState({
            ...initialGameState,
            players,
            gameStarted: true
        });
    };
    // 重新开始游戏
    const restartGame = () => {
        setGameState(initialGameState);
    };
    if (!gameState.gameStarted) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 p-4", children: _jsxs("div", { className: "bg-white p-6 md:p-8 rounded-lg shadow-xl text-center max-w-md w-full", children: [_jsx("h1", { className: "text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800", children: "\u9AB0\u5B50\u95EF\u5173\u6E38\u620F" }), _jsx("p", { className: "mb-4 md:mb-6 text-gray-600 text-sm md:text-base", children: "\u9009\u62E9\u73A9\u5BB6\u6570\u91CF\u5F00\u59CB\u6E38\u620F" }), _jsx("div", { className: "space-y-3 md:space-y-4", children: [2, 3, 4, 5, 6].map(count => (_jsxs("button", { onClick: () => initializeGame(count), className: "w-full bg-blue-500 hover:bg-blue-600 text-white py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base", children: [count, " \u4EBA\u6E38\u620F"] }, count))) }), isMobile && (_jsx("div", { className: "mt-4 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-xs", children: "\uD83D\uDCA1 \u63D0\u793A\uFF1A\u5EFA\u8BAE\u6A2A\u5C4F\u4EE5\u83B7\u5F97\u66F4\u597D\u7684\u6E38\u620F\u4F53\u9A8C" }))] }) }));
    }
    // 游戏结束界面
    if (gameState.gameOver && gameState.winner) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4", children: _jsxs("div", { className: "bg-white p-6 md:p-8 rounded-lg shadow-xl text-center max-w-md w-full", children: [_jsx("h1", { className: "text-2xl md:text-3xl font-bold mb-4 text-green-600", children: "\uD83C\uDF89 \u6E38\u620F\u7ED3\u675F\uFF01" }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "text-xl font-semibold text-gray-800", children: ["\u83B7\u80DC\u8005\uFF1A", gameState.winner.name] }), _jsx("div", { className: "text-gray-600 mt-2", children: "\u606D\u559C\u83B7\u5F97\u80DC\u5229\uFF01" })] }), _jsx("button", { onClick: restartGame, className: "w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors", children: "\u91CD\u65B0\u5F00\u59CB\u6E38\u620F" })] }) }));
    }
    return (_jsxs("div", { className: `min-h-screen flex ${orientation === 'landscape' ? 'flex-row' : 'flex-col'}`, children: [_jsx("div", { className: `${orientation === 'landscape' ? 'w-3/4' : 'h-3/4'} relative`, children: _jsx(GameBoard, { gameState: gameState, orientation: orientation }) }), _jsx("div", { className: `${orientation === 'landscape' ? 'w-1/4' : 'h-1/4'} bg-gray-50 border-t border-l border-gray-200 overflow-auto`, children: _jsxs("div", { className: "p-2 md:p-4 space-y-3 md:space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("button", { onClick: restartGame, className: "text-xs md:text-sm text-red-600 hover:text-red-700", children: "\u91CD\u65B0\u5F00\u59CB" }), isMobile && (_jsx("div", { className: "text-xs text-gray-500", children: orientation === 'portrait' ? '竖屏' : '横屏' }))] }), _jsx(DiceRoller, { gameState: gameState, setGameState: setGameState }), _jsx(PlayerHand, { player: gameState.players[gameState.currentPlayerIndex], gameState: gameState, setGameState: setGameState })] }) })] }));
}
export default App;
