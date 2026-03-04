"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

interface Controls {
  front: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

function ControlButton({
  active,
  onPress,
  onRelease,
  children,
}: {
  active: boolean;
  onPress: () => void;
  onRelease: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onContextMenu={(e) => e.preventDefault()}
      className={`rounded-lg px-4 py-2 font-medium transition-colors touch-none select-none ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-200 text-zinc-700 dark:bg-transparent dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
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
  const [controls, setControls] = useState<Controls>({
    front: false,
    back: false,
    left: false,
    right: false,
    jump: false,
  });
  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  const accelerationRef = useRef(acceleration);
  const accelerationIncludingGravityRef = useRef(accelerationIncludingGravity);
  const rotationRateRef = useRef(rotationRate);

  const [interval, setInterval] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? "ws://localhost:8765";
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const lastMotionSendRef = useRef<number>(0);

  useEffect(() => {
    const ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send('Hello, WebSocket!');
      setWebsocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.timestamp) {
          setRtt(Date.now() - data.timestamp);
        }
      } catch (e) {
        // Not JSON, ignore
      }
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
      websocket.send(JSON.stringify({
        controls: controlsRef.current,
        acceleration,
        accelerationIncludingGravity,
        rotationRate,
      }));
    }
  };

  const sendControlsUpdate = useCallback(() => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      const timestamp = Date.now();
      websocket.send(JSON.stringify({
        controls: controlsRef.current,
        acceleration: accelerationRef.current,
        accelerationIncludingGravity: accelerationIncludingGravityRef.current,
        rotationRate: rotationRateRef.current,
        timestamp,
        interval,
      }));
    }
  }, [websocket, interval]);


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
      const accel = event.acceleration
        ? { x: event.acceleration.x, y: event.acceleration.y, z: event.acceleration.z }
        : { x: null, y: null, z: null };
      const accelGravity = event.accelerationIncludingGravity
        ? {
            x: event.accelerationIncludingGravity.x,
            y: event.accelerationIncludingGravity.y,
            z: event.accelerationIncludingGravity.z,
          }
        : { x: null, y: null, z: null };
      const rotation = event.rotationRate
        ? {
            alpha: event.rotationRate.alpha,
            beta: event.rotationRate.beta,
            gamma: event.rotationRate.gamma,
          }
        : { alpha: null, beta: null, gamma: null };

      setAcceleration(accel);
      setAccelerationIncludingGravity(accelGravity);
      setRotationRate(rotation);
      accelerationRef.current = accel;
      accelerationIncludingGravityRef.current = accelGravity;
      rotationRateRef.current = rotation;
      if (event.interval) setInterval(event.interval);

      // Throttle motion sends to 10Hz (100ms) to reduce network load
      const now = Date.now();
      if (now - lastMotionSendRef.current > 100) {
        lastMotionSendRef.current = now;
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({
            controls: controlsRef.current,
            acceleration: accel,
            accelerationIncludingGravity: accelGravity,
            rotationRate: rotation,
            timestamp: Date.now(),
            interval,
          }));
        }
      }
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
      <section className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
          Network Status
        </h2>
        <div className="font-mono text-lg">
          <div>RTT: {rtt !== null ? `${rtt}ms` : "—"}</div>
        </div>
      </section>
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Controls
        </h2>
        <div className="grid grid-cols-3 gap-2 w-fit mx-auto" style={{ gridTemplateRows: "repeat(3, auto)" }}>
          {/* Row 1: empty, forward, empty */}
          <div />
          <ControlButton
            active={controls.front}
            onPress={() => {
              console.log(`[FRONT PRESSED] interval=${interval}ms`);
              setControls((prev) => ({ ...prev, front: true }));
              controlsRef.current = { ...controlsRef.current, front: true };
              sendControlsUpdate();
            }}
            onRelease={() => {
              setControls((prev) => ({ ...prev, front: false }));
              controlsRef.current = { ...controlsRef.current, front: false };
              sendControlsUpdate();
            }}
          >
            <img src="/buttons/Forward_button_BE2.png" alt="Up" width={50} height={50} />
          </ControlButton>
          <div />
          {/* Row 2: left, jump, right */}
          <ControlButton
            active={controls.left}
            onPress={() => {
              setControls((prev) => ({ ...prev, left: true }));
              controlsRef.current = { ...controlsRef.current, left: true };
              sendControlsUpdate();
            }}
            onRelease={() => {
              setControls((prev) => ({ ...prev, left: false }));
              controlsRef.current = { ...controlsRef.current, left: false };
              sendControlsUpdate();
            }}
          >
            <img src="/buttons/Left_button_BE2.png" alt="Left" width={50} height={50} />
            </ControlButton>
          <ControlButton
            active={controls.jump}
            onPress={() => {
              setControls((prev) => ({ ...prev, jump: true }));
              controlsRef.current = { ...controlsRef.current, jump: true };
              sendControlsUpdate();
            }}
            onRelease={() => {
              setControls((prev) => ({ ...prev, jump: false }));
              controlsRef.current = { ...controlsRef.current, jump: false };
              sendControlsUpdate();
            }}
          >
            <img src="/buttons/Jump_button_BE2.png" alt="Jump" width={50} height={50} />
          </ControlButton>
          <ControlButton
            active={controls.right}
            onPress={() => {
              setControls((prev) => ({ ...prev, right: true }));
              controlsRef.current = { ...controlsRef.current, right: true };
              sendControlsUpdate();
            }}
            onRelease={() => {
              setControls((prev) => ({ ...prev, right: false }));
              controlsRef.current = { ...controlsRef.current, right: false };
              sendControlsUpdate();
            }}
          >
            <img src="/buttons/Right_button_BE2.png" alt="Right" width={50} height={50} />
          </ControlButton>
          {/* Row 3: empty, back, empty */}
          <div />
          <ControlButton
            active={controls.back}
            onPress={() => {
              setControls((prev) => ({ ...prev, back: true }));
              controlsRef.current = { ...controlsRef.current, back: true };
              sendControlsUpdate();
            }}
            onRelease={() => {
              setControls((prev) => ({ ...prev, back: false }));
              controlsRef.current = { ...controlsRef.current, back: false };
              sendControlsUpdate();
            }}
          >
            <img src="/buttons/Backward_button_BE2.png" alt="Back" width={50} height={50} />
          </ControlButton>
          <div />
        </div>
      </section>
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
