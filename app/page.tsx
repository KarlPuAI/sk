"use client";

import React, { useState, useEffect, useRef } from "react";

// 贪吃蛇游戏参数
const BOARD_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const SPEED = 120; // ms

function getRandomFood(snake: { x: number; y: number }[]): { x: number; y: number } {
  let newFood: { x: number; y: number };
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
    if (!snake.some((s) => s.x === newFood.x && s.y === newFood.y)) break;
  }
  return newFood;
}

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  // 初始 food 用固定值，避免 SSR/CSR 不一致
  const [food, setFood] = useState<{x:number;y:number}>({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const moveRef = useRef(direction);
  moveRef.current = direction;
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // 首次渲染后再生成随机 food
  useEffect(() => {
    setFood(getRandomFood(INITIAL_SNAKE));
    // eslint-disable-next-line
  }, []);

  // 方向控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case "ArrowUp":
          if (moveRef.current.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          if (moveRef.current.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          if (moveRef.current.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          if (moveRef.current.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver]);

  // 游戏主循环
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setSnake((prev) => {
        const newHead = {
          x: prev[0].x + moveRef.current.x,
          y: prev[0].y + moveRef.current.y,
        };
        // 撞墙或撞自己
        if (
          newHead.x < 0 ||
          newHead.x >= BOARD_SIZE ||
          newHead.y < 0 ||
          newHead.y >= BOARD_SIZE ||
          prev.some((s) => s.x === newHead.x && s.y === newHead.y)
        ) {
          setGameOver(true);
          return prev;
        }
        let newSnake;
        if (newHead.x === food.x && newHead.y === food.y) {
          newSnake = [newHead, ...prev];
          setFood(getRandomFood([newHead, ...prev]));
          setScore((s) => s + 1);
        } else {
          newSnake = [newHead, ...prev.slice(0, -1)];
        }
        return newSnake;
      });
    }, SPEED);
    return () => clearInterval(interval);
  }, [food, gameOver]);

  useEffect(() => {
    if (gameOver) {
      setShowNameInput(true);
    } else {
      setShowNameInput(false);
      setPlayerName("");
      setSaveStatus(null);
    }
  }, [gameOver]);

  const handleRestart = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(getRandomFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
  };

  const handleSaveScore = async () => {
    if (!playerName) {
      setSaveStatus("请输入名字");
      return;
    }
    setSaveStatus("保存中...");
    try {
      const res = await fetch("/api/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_name: playerName, score }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveStatus("保存成功！");
      } else {
        setSaveStatus("保存失败：" + (data.error || "未知错误"));
      }
    } catch (e) {
      setSaveStatus("保存失败：" + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
      <h1 className="text-3xl font-bold mb-4">贪吃蛇小游戏</h1>
      <div
        className="grid"
        style={{
          gridTemplateRows: `repeat(${BOARD_SIZE}, 20px)`,
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 20px)`,
          border: "2px solid #333",
          background: "#fff",
        }}
      >
        {[...Array(BOARD_SIZE * BOARD_SIZE)].map((_, i) => {
          const x = i % BOARD_SIZE;
          const y = Math.floor(i / BOARD_SIZE);
          const isSnake = snake.some((s) => s.x === x && s.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isFood = food.x === x && food.y === y;
          return (
            <div
              key={i}
              className="w-5 h-5 border border-gray-200 box-border"
              style={{
                background: isHead
                  ? "#16a34a"
                  : isSnake
                  ? "#4ade80"
                  : isFood
                  ? "#f59e42"
                  : "#fff",
              }}
            />
          );
        })}
      </div>
      <div className="mt-4 text-lg">分数：{score}</div>
      {gameOver && (
        <div className="mt-4 text-red-600 font-bold">
          游戏结束！
          <button
            className="ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleRestart}
          >
            重新开始
          </button>
        </div>
      )}
      {showNameInput && (
        <div className="mt-4 flex flex-col items-center">
          <div className="mb-2">请输入你的名字保存分数：</div>
          <input
            className="border px-2 py-1 rounded mb-2"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            maxLength={20}
            placeholder="你的名字"
          />
          <button
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSaveScore}
            disabled={!playerName || saveStatus === "保存中..."}
          >
            保存分数
          </button>
          {saveStatus && <div className="mt-2 text-sm">{saveStatus}</div>}
        </div>
      )}
      <div className="mt-4 text-gray-500 text-sm">方向键控制移动</div>
    </div>
  );
};

export default function Home() {
  return <SnakeGame />;
}
