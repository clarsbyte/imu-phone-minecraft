import asyncio
import websockets

async def connect_and_send():
    """
    Connects to the server, sends a message, and receives a response.
    """
    uri = "ws://localhost:8765"
    # Use the connect function to establish a connection
    async with websockets.connect(uri) as websocket:
        message_to_send = "Hello World!"
        await websocket.send(message_to_send)
        print(f"> Sent: {message_to_send}")

        response = await websocket.recv()
        print(f"< Received: {response}")
        

if __name__ == "__main__":
    asyncio.run(connect_and_send())