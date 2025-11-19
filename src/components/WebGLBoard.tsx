import React, { useRef, useEffect } from "react";
import { useGameContext } from "../contexts/GameContext";
import { Render } from "./Render";



const WebGLBoard: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { gameInstance } = useGameContext();

  const started = gameInstance?.gameStarted;

  useEffect(() => {
    if (!mountRef.current || !gameInstance || !started) return;
    const render = new Render(mountRef.current);
    // 环境 & 方向光
    import("three").then((THREE) => {
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
        gridSize * tileSpacing + 2,
      );
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.5;
      render.addObject(ground);
    });
    // 从gameInstance获取tiles并直接使用其3D渲染功能
    const tiles = gameInstance.gameBoard.tiles;
    tiles.forEach((tile) => tile.addToRender(render));

    // 为玩家创建3D渲染并添加到场景
    const colorArr = [
      0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff,
    ];
    gameInstance.players.forEach((player, i) => {
      // 设置玩家的颜色
      import("three").then((THREE) => {
        player.mesh.material = new THREE.MeshLambertMaterial({ color: colorArr[i % colorArr.length] });
      });
      player.addToRender(render);
    });

    // 相机设置
    render.setCameraPosition(0, 15, 15);
    render.lookAt(0, 0, 0);

    // 动画帧内更新
    render.setOnRender(() => {
      // 位置更新已经在Player类的position setter中自动处理
      // 这里可以添加其他需要每帧更新的逻辑
    });
    render.render();

    return () => {
      tiles.forEach((tile) => tile.removeFromRender(render));
      gameInstance.players.forEach((player) => player.removeFromRender(render));
      render.dispose();
    };
  }, [gameInstance, started]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default WebGLBoard;
