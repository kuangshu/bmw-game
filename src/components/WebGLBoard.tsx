import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GameState } from "../entities/Game";
import { useGameContext } from "../contexts/GameContext";

interface WebGLBoardProps {
  gameState: GameState;
}

const WebGLBoard: React.FC<WebGLBoardProps> = ({ gameState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { tiles } = useGameContext();

  useEffect(() => {
    if (!mountRef.current) return;

    // 场景设置
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setClearColor(0x87ceeb); // 天空蓝背景
    mountRef.current.appendChild(renderer.domElement);

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // 创建游戏地图网格
    const gridSize = 9;
    const tileSpacing = 2;

    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(
      gridSize * tileSpacing + 2,
      gridSize * tileSpacing + 2
    );
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    scene.add(ground);

    // 创建格子
    const threeTiles: THREE.Mesh[] = [];
    tiles.forEach((tileData, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      const geometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
      let material: THREE.Material;

      // 根据格子类型设置颜色
      switch (tileData.type) {
        case 'boss':
          material = new THREE.MeshLambertMaterial({ color: 0x800080 }); // BOSS格 - 紫色
          break;
        case 'treasure':
          material = new THREE.MeshLambertMaterial({ color: 0xffd700 }); // 宝箱格 - 金色
          break;
        case 'reverse':
          material = new THREE.MeshLambertMaterial({ color: 0xff4500 }); // 反转格 - 红色
          break;
        case 'supply':
          material = new THREE.MeshLambertMaterial({ color: 0x32cd32 }); // 补给站格 - 绿色
          break;
        default:
          material = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 }); // 空白格 - 浅灰色
      }

      const tile = new THREE.Mesh(geometry, material);
      tile.position.set(
        (col - gridSize / 2) * tileSpacing,
        0,
        (row - gridSize / 2) * tileSpacing
      );

      scene.add(tile);
      threeTiles.push(tile);
    });

    // 创建玩家标记（小球）
    const playerMarkers: THREE.Mesh[] = [];
    gameState.players.forEach((player, index) => {
      const geometry = new THREE.SphereGeometry(0.3);
      const material = new THREE.MeshLambertMaterial({
        color: [0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff][
          index
        ],
      });
      const marker = new THREE.Mesh(geometry, material);

      const row = Math.floor(player.position / gridSize);
      const col = player.position % gridSize;

      marker.position.set(
        (col - gridSize / 2) * tileSpacing,
        0.5,
        (row - gridSize / 2) * tileSpacing
      );

      scene.add(marker);
      playerMarkers.push(marker);
    });

    // 相机位置
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);

      // 更新玩家位置
      gameState.players.forEach((player, index) => {
        const row = Math.floor(player.position / gridSize);
        const col = player.position % gridSize;

        playerMarkers[index].position.set(
          (col - gridSize / 2) * tileSpacing,
          0.5,
          (row - gridSize / 2) * tileSpacing
        );
      });

      renderer.render(scene, camera);
    };

    animate();

    // 窗口大小调整处理
    const handleResize = () => {
      if (!mountRef.current) return;

      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
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
