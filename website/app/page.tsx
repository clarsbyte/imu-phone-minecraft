"use client";
import MotionSensor from "./MotionSensor";
import { useEffect, useState } from 'react';

export default function Home() {
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? 'ws://localhost:8765';
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send('Hello, WebSocket!');
      setWebsocket(ws);
    };

    ws.onmessage = (event) => {
      console.log(event.data);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setWebsocket(null);
    };

    return () => {
      ws.close();
    };
  }, [websocketUrl]);

  const sendMessage = () => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send('Hello server!');
    } else {
      console.log('WebSocket not connected');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Motion Sensors
        </h1>
        <button onClick={sendMessage}>Send Message</button>
        <MotionSensor />
      </main>
    </div>
  );
}
