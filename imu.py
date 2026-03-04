import socket 
import json

UDP_IP = # something
UDP_PORT = 65000

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

while True:
    data, addr = sock.recvfrom(4096) 
    try:
        imu_data = json.loads(data.decode())
        print("Received IMU data:")
        print(imu_data['accelZ'])
    except:
        print("Received non-JSON data:")
        print(data)