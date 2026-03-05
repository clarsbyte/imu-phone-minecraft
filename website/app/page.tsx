"use client";
import MotionSensor from "./MotionSensor";
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState<string>('localhost:8765');
  const [confirmedServer, setConfirmedServer] = useState<string | null>(null);

  if (!confirmedServer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            IMU Minecraft Controller
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter the WebSocket server address to connect.
          </p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) setConfirmedServer(input.trim()); }}
            placeholder="localhost:8765"
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            disabled={!input.trim()}
            onClick={() => setConfirmedServer(input.trim())}
            className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          IMU Minecraft Controller
        </h1>
        <MotionSensor target_server={
          /^wss?:\/\//.test(confirmedServer)
            ? confirmedServer
            : confirmedServer.startsWith('https://')
              ? confirmedServer.replace('https://', 'wss://')
              : confirmedServer.startsWith('http://')
                ? confirmedServer.replace('http://', 'ws://')
                : `ws://${confirmedServer}`
        } />
      </main>
    </div>
  );
}
