import { useState } from 'react'
import { GameState, Tile, TileType } from '../types/game'
import WebGLBoard from './WebGLBoard'

interface GameBoardProps {
  gameState: GameState
  orientation: 'portrait' | 'landscape'
}

const TOTAL_TILES = 81
const BOSS_POSITIONS = [20, 32, 44, 56, 68, 80]
const BOSS_REQUIREMENTS = [8, 12, 12, 14, 18, 20]

const generateTiles = (): Tile[] => {
  const tiles: Tile[] = []
  
  for (let i = 0; i < TOTAL_TILES; i++) {
    let type: TileType = 'empty'
    let bossRequirement: number | undefined
    
    if (BOSS_POSITIONS.includes(i)) {
      type = 'boss'
      bossRequirement = BOSS_REQUIREMENTS[BOSS_POSITIONS.indexOf(i)]
    } else if (i % 7 === 0 && i > 0) {
      type = 'treasure'
    } else if (i % 9 === 0 && i > 0) {
      type = 'reverse'
    } else if (i % 11 === 0 && i > 0) {
      type = 'supply'
    }
    
    tiles.push({ position: i, type, bossRequirement })
  }
  
  return tiles
}

const getTileColor = (type: TileType): string => {
  switch (type) {
    case 'empty': return 'bg-gray-200'
    case 'treasure': return 'bg-yellow-400'
    case 'reverse': return 'bg-red-400'
    case 'supply': return 'bg-green-400'
    case 'boss': return 'bg-purple-400'
    default: return 'bg-gray-200'
  }
}

const getTileLabel = (tile: Tile): string => {
  switch (tile.type) {
    case 'empty': return ''
    case 'treasure': return '宝箱'
    case 'reverse': return '反转'
    case 'supply': return '补给'
    case 'boss': return `BOSS\\n${tile.bossRequirement}`
    default: return ''
  }
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const [useWebGL, setUseWebGL] = useState(false)
  const tiles = generateTiles()

  if (useWebGL) {
    return (
      <div className="w-full h-full relative">
        <WebGLBoard gameState={gameState} />
        <button
          onClick={() => setUseWebGL(false)}
          className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 px-3 py-1 rounded text-sm shadow-md transition-all"
        >
          切换到2D视图
        </button>
      </div>
    )
  }
  
  return (
    <div className="w-full h-full bg-blue-100 p-4 overflow-auto relative">
      <button
        onClick={() => setUseWebGL(true)}
        className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 px-3 py-1 rounded text-sm shadow-md transition-all z-10"
      >
        切换到3D视图
      </button>
      
      <div className="grid grid-cols-9 gap-2 max-w-md mx-auto">
        {tiles.map((tile, index) => (
          <div
            key={index}
            className={`relative w-12 h-12 rounded-lg border-2 border-white flex items-center justify-center text-xs font-bold text-center ${getTileColor(tile.type)}`}
          >
            <span className="text-[10px] leading-tight">{getTileLabel(tile)}</span>
            {gameState.players.map(player => (
              player.position === tile.position && (
                <div
                  key={player.id}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center"
                >
                  {player.id}
                </div>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default GameBoard