import asyncio
import websockets

async def echo(websocket):
    """
    This function is called for every new client connection.
    It receives messages and sends them back (echos them).
    """
    async for message in websocket:
        print(f"Received: {message}")
        await websocket.send(message)
        print(f"Sent: {message}")

async def main():
    """
    Starts the WebSocket server on localhost, port 8765.
    """
    # Use the serve function from the websockets library
    async with websockets.serve(echo, "localhost", 8765):
        await asyncio.Future() # Run forever

if __name__ == "__main__":
    # Run the main function using asyncio
    asyncio.run(main())
