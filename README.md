# IMU Minecraft Controller

Control Minecraft using your phone's gyroscope and accelerometer over WebSocket.

---

## How to Connect

### 1. Install the Minescript Mod

Minescript lets Python scripts run inside Minecraft.

1. Go to [Minescript on Modrinth](https://modrinth.com/mod/minescript/versions) and download the latest version for your Minecraft version.
2. Press **Win + R**, type `%appdata%`, and hit Enter.
3. Navigate to `.minecraft` → `mods`.
4. Drag the downloaded `.jar` file into the `mods` folder.

### 2. Add the Script

1. Open `.minecraft` (same folder as above).
2. Create a folder called `minescript` if it doesn't already exist.
3. Drag `imu_control.py` into that `minescript` folder.

### 3. Start the Script in Minecraft

1. Launch Minecraft with the Minescript mod loaded.
2. Load into a world.
3. Press **Ctrl + T** to open the Minescript chat prompt.
4. Type `imu_control` and press Enter.

You should see a **"Connected"** message once a phone connects.

> **Note:** The script starts a WebSocket server on `localhost:8765` by default.  
> If you want to connect from your phone over the internet, use a tunnel like [ngrok](https://ngrok.com):
> ```
> ngrok http 8765 --scheme=http
> ```
> Then use the `wss://` URL it gives you (e.g. `wss://your-tunnel.ngrok-free.app`).

### 4. Open the Website on Your Phone

1. Open the controller [website](https://playimu.clarissabuilds.com/) on your phone's browser.
2. When prompted, enter the WebSocket address:
   - Local (same network): `localhost:8765`
   - Over the internet via ngrok: `wss://your-tunnel.ngrok-free.app`
3. Tap **Connect**.
4. Grant motion sensor permission if prompted.

That's it! Tilt your phone to look around, and use the on-screen buttons to move and jump.

---

## Controls

| Input | Action |
|---|---|
| Tilt phone up/down | Look up/down (pitch) |
| Tilt phone left/right | Look left/right (yaw) |
| ▲ button | Move forward |
| ▼ button | Move backward |
| ◀ / ▶ buttons | Strafe left / right |
| ◆ center button | Jump |
| Flick wrist (fast twist) | Attack |
