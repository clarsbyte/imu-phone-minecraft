import socket 
import json
import math
import time
import minescript
import asyncio
import websockets

PITCH_SENSITIVITY = 1.0  
PITCH_DEADZONE = 15.0   
YAW_SENSITIVITY = 1.0   
YAW_DEADZONE = 15.0     

_state = {
    "pitch_velocity": 0.0,  
    "yaw_velocity": 0.0,    
    "controls": {},
    "prev_gamma": None,
    "prev_time": None,
}

async def smooth_orientation_loop():
    """Runs at ~60fps to apply yaw and pitch changes smoothly, independent of WebSocket rate."""
    tick = 1.0 / 60.0
    loop = asyncio.get_event_loop()
    while True:
        pitch_vel = _state["pitch_velocity"]
        yaw_vel = _state["yaw_velocity"]
        if abs(pitch_vel) > PITCH_DEADZONE or abs(yaw_vel) > YAW_DEADZONE:
            curr = minescript.player_orientation()
            new_yaw = curr[0] - (yaw_vel * tick * YAW_SENSITIVITY if abs(yaw_vel) > YAW_DEADZONE else 0)
            new_pitch = max(-90.0, min(90.0, curr[1] - (pitch_vel * tick * PITCH_SENSITIVITY if abs(pitch_vel) > PITCH_DEADZONE else 0)))
            await loop.run_in_executor(None, minescript.player_set_orientation, new_yaw, new_pitch)
        await asyncio.sleep(tick)

async def echo(websocket):
    """
    This function is called for every new client connection.
    It receives messages and sends them back (echos them).
    """
    minescript.echo("Connected")
    async for message in websocket:
        receive_time = time.time() * 1000
        try:
            imu_data = json.loads(message)
        except json.JSONDecodeError:
            await websocket.send(message)
            continue

        frontend_timestamp = imu_data.get("timestamp")
        if frontend_timestamp is not None:
            rtt = receive_time - frontend_timestamp

        await websocket.send(message)

        controls = imu_data.get("controls", {})
        gamma = imu_data.get("rotationRate", {}).get("gamma", 0) or 0
        alpha = imu_data.get("rotationRate", {}).get("alpha", 0) or 0
        beta = imu_data.get("rotationRate", {}).get("beta", 0) or 0
        now = time.time()
        loop = asyncio.get_event_loop()

        # Update shared velocities for the smooth loops to consume
        _state["pitch_velocity"] = alpha
        _state["yaw_velocity"] = beta

        captured_controls = controls
        captured_prev_gamma = _state["prev_gamma"]
        captured_prev_time = _state["prev_time"]

        async def handle_controls():
            await asyncio.gather(
                loop.run_in_executor(None, minescript.press_key_bind, "key.forward", captured_controls.get("front", False)),
                loop.run_in_executor(None, minescript.press_key_bind, "key.back", captured_controls.get("back", False)),
                loop.run_in_executor(None, minescript.press_key_bind, "key.left", captured_controls.get("left", False)),
                loop.run_in_executor(None, minescript.press_key_bind, "key.right", captured_controls.get("right", False)),
                loop.run_in_executor(None, minescript.press_key_bind, "key.jump", captured_controls.get("jump", False)),
            )

        async def handle_attack():
            if captured_prev_gamma is not None and captured_prev_time is not None:
                dt = now - captured_prev_time
                if dt > 0:
                    angular_accel = (gamma - captured_prev_gamma) / dt
                    if abs(angular_accel) > 2000:
                        await loop.run_in_executor(None, minescript.press_key_bind, "key.attack", True)
                        await loop.run_in_executor(None, minescript.press_key_bind, "key.attack", False)

        asyncio.create_task(handle_controls())
        asyncio.create_task(handle_attack())

        _state["prev_gamma"] = gamma
        _state["prev_time"] = now   

async def main():
    """
    Starts the WebSocket server on localhost, port 8765.
    """
    asyncio.create_task(smooth_orientation_loop())
    async with websockets.serve(echo, "localhost", 8765):
        await asyncio.Future() # Run forever

if __name__ == "__main__":
    asyncio.run(main())