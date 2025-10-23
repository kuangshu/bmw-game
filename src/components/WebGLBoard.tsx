import React, { useRef, useEffect } from "react";
import { useGameContext } from "../contexts/GameContext";
import { Render } from "./Render";
import { Tile3D } from "../entities/Tile";
import { Player3D } from "../entities/Player";

const WebGLBoard: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { gameInstance } = useGameContext();

  // 从gameInstance获取游戏状态
  const gameState = gameInstance ? gameInstance.toJSON() : {
    players: [],
    currentPlayerIndex: 0,
    gameStarted: false,
    gameOver: false,
    winner: null
  };

  // 从gameInstance获取tiles
  const tiles = gameInstance ? gameInstance.gameBoard.tiles : [];

  useEffect(() => {
    if (!mountRef.current) return;
    const render = new Render(mountRef.current);
    // 环境 & 方向光
    import("three").then(THREE => {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      render.addObject(ambientLight);
      render.addObject(directionalLight);
      // 地面
      const gridSize = 9;
      const tileSpacing = 2;
      const groundGeometry = new THREE.PlaneGeometry(
        gridSize * tileSpacing + 2,
        gridSize * tileSpacing + 2
      );
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.5;
      render.addObject(ground);
    });

    // Tile3D 对象
    const tileObjects: Tile3D[] = tiles.map(td => new Tile3D(td));
    tileObjects.forEach(t3d => t3d.addToRender(render));

    // Player3D 对象
    const colorArr = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff];
    const playerObjects = gameState.players.map((pdata, i) => new Player3D(pdata, colorArr[i % colorArr.length]));
    playerObjects.forEach(p3d => p3d.addToRender(render));

    // 相机设置
    render.setCameraPosition(0, 15, 15);
    render.lookAt(0, 0, 0);

    // 动画帧内更新玩家位置
    render.setOnRender(() => {
      gameState.players.forEach((player, index) => {
        if (!playerObjects[index]) return;
        playerObjects[index].updatePosition(player.position);
      });
    });
    render.render();

    return () => {
      tileObjects.forEach(t3d => t3d.removeFromRender(render));
      playerObjects.forEach(p3d => p3d.removeFromRender(render));
      render.dispose();
    };
  }, [gameState, tiles]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default WebGLBoard;
