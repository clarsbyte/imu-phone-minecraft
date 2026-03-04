"use client";

import { useState, useEffect, useCallback } from "react";

interface Acceleration {
  x: number | null;
  y: number | null;
  z: number | null;
}

interface RotationRate {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

export default function MotionSensor() {
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const [acceleration, setAcceleration] = useState<Acceleration>({ x: null, y: null, z: null });
  const [accelerationIncludingGravity, setAccelerationIncludingGravity] = useState<Acceleration>({
    x: null,
    y: null,
    z: null,
  });
  const [rotationRate, setRotationRate] = useState<RotationRate>({
    alpha: null,
    beta: null,
    gamma: null,
  });
  const [interval, setInterval] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
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

  const sendMessage = (acceleration: Acceleration, 
          accelerationIncludingGravity: Acceleration,
          rotationRate: RotationRate) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ acceleration, 
        accelerationIncludingGravity, 
        rotationRate }));
    } else {
      console.log('WebSocket not connected');
    }
  };


  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      try {
        const result = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        setPermission(result === "granted" ? "granted" : "denied");
        setError(result === "denied" ? "Permission denied" : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Permission request failed");
        setPermission("denied");
      }
    } else {
      setPermission("granted");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission !== "function") {
      setPermission("granted");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || permission !== "granted") return;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (event.acceleration) {
        setAcceleration({
          x: event.acceleration.x,
          y: event.acceleration.y,
          z: event.acceleration.z,
        });
      }
      if (event.accelerationIncludingGravity) {
        setAccelerationIncludingGravity({
          x: event.accelerationIncludingGravity.x,
          y: event.accelerationIncludingGravity.y,
          z: event.accelerationIncludingGravity.z,
        });
      }
      if (event.rotationRate) {
        setRotationRate({
          alpha: event.rotationRate.alpha,
          beta: event.rotationRate.beta,
          gamma: event.rotationRate.gamma,
        });
      }
      if (event.interval) {
        setInterval(event.interval);
      }
      sendMessage(acceleration, accelerationIncludingGravity, rotationRate);
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [permission]);

  const formatValue = (v: number | null) => (v !== null ? v.toFixed(2) : "—");

  if (typeof window === "undefined") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500">Loading sensors…</p>
      </div>
    );
  }

  if (permission === "prompt") {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          Accelerometer and gyroscope require permission to access motion sensors.
        </p>
        <button
          type="button"
          onClick={requestPermission}
          className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Enable Motion Sensors
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-amber-800 dark:text-amber-200">
          Motion sensor access was denied. Reload and try again, or enable it in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-md gap-6">
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Accelerometer (m/s²)
        </h2>
        <div className="font-mono text-lg">
          <div>X: {formatValue(acceleration.x)}</div>
          <div>Y: {formatValue(acceleration.y)}</div>
          <div>Z: {formatValue(acceleration.z)}</div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Acceleration (incl. gravity) (m/s²)
        </h2>
        <div className="font-mono text-lg">
          <div>X: {formatValue(accelerationIncludingGravity.x)}</div>
          <div>Y: {formatValue(accelerationIncludingGravity.y)}</div>
          <div>Z: {formatValue(accelerationIncludingGravity.z)}</div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Gyroscope (°/s)
        </h2>
        <div className="font-mono text-lg">
          <div>α (alpha): {formatValue(rotationRate.alpha)}</div>
          <div>β (beta): {formatValue(rotationRate.beta)}</div>
          <div>γ (gamma): {formatValue(rotationRate.gamma)}</div>
        </div>
      </section>

      {interval !== null && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Update interval: {interval} ms
        </p>
      )}
    </div>
  );
}
