#!/usr/bin/env python3
"""
MotorVisuales — Pasarela Bidireccional OSC (Open Sound Control) <-> WebSockets
Permite la comunicación en tiempo real entre MotorVisuales y entornos profesionales
de directo como TouchDesigner, Resolume Arena, Max/MSP, PureData y Ableton Live.

Rutas de flujo:
  1. MotorVisuales (Navegador) --[WebSocket / ws://localhost:8089]--> osc_bridge.py --[UDP OSC / 9000]--> TouchDesigner/Resolume
  2. TouchDesigner/Resolume --[UDP OSC / 9001]--> osc_bridge.py --[WebSocket]--> MotorVisuales (Navegador)
"""

import sys
import asyncio
import socket
import argparse
import json
import struct

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    import websockets
except ImportError:
    print("[ERROR] El módulo 'websockets' no está instalado. Ejecute: pip install websockets")
    sys.exit(1)

connected_clients = set()
udp_sock = None
TARGET_UDP_IP = "127.0.0.1"
TARGET_UDP_PORT = 9000
LISTEN_UDP_PORT = 9001
WS_PORT = 8089

def pack_osc_string(s: str) -> bytes:
    b = s.encode('utf-8') + b'\x00'
    pad = (4 - (len(b) % 4)) % 4
    return b + (b'\x00' * pad)

def json_to_osc(data: dict) -> bytes:
    """Convierte un objeto JSON {address: str, args: list} a paquete binario OSC 1.0."""
    address = data.get('address', '/motor/telemetry')
    args = data.get('args', [])
    
    addr_bytes = pack_osc_string(address)
    type_tags = ','
    arg_bytes = b''
    
    for a in args:
        if isinstance(a, float):
            type_tags += 'f'
            arg_bytes += struct.pack('>f', a)
        elif isinstance(a, int):
            type_tags += 'i'
            arg_bytes += struct.pack('>i', a)
        elif isinstance(a, str):
            type_tags += 's'
            arg_bytes += pack_osc_string(a)
        elif isinstance(a, bool):
            type_tags += 'T' if a else 'F'
        else:
            type_tags += 'f'
            arg_bytes += struct.pack('>f', float(a))
            
    tag_bytes = pack_osc_string(type_tags)
    return addr_bytes + tag_bytes + arg_bytes

async def ws_handler(websocket):
    connected_clients.add(websocket)
    remote_ip = websocket.remote_address[0] if websocket.remote_address else "local"
    print(f"[WS] + Cliente MotorVisuales conectado desde {remote_ip} (Total clientes: {len(connected_clients)})")
    
    # Notificar conexión inicial al cliente
    welcome_msg = json.dumps({
        "type": "bridge_status",
        "status": "connected",
        "ws_port": WS_PORT,
        "udp_target": f"{TARGET_UDP_IP}:{TARGET_UDP_PORT}",
        "udp_listen": LISTEN_UDP_PORT
    })
    await websocket.send(welcome_msg)
    
    try:
        async for message in websocket:
            # Si el mensaje es binario (paquete OSC puro)
            if isinstance(message, bytes):
                if udp_sock:
                    udp_sock.sendto(message, (TARGET_UDP_IP, TARGET_UDP_PORT))
            else:
                # Si el mensaje es JSON, puede ser comando interno o mensaje JSON-OSC
                try:
                    payload = json.loads(message)
                    if isinstance(payload, dict) and "address" in payload:
                        osc_bytes = json_to_osc(payload)
                        if udp_sock:
                            udp_sock.sendto(osc_bytes, (TARGET_UDP_IP, TARGET_UDP_PORT))
                    elif payload.get("type") == "ping":
                        pong = json.dumps({"type": "pong", "time": asyncio.get_event_loop().time()})
                        await websocket.send(pong)
                except Exception as e:
                    # Enviar como string sin procesar si no es JSON válido
                    pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        print(f"[WS] - Cliente desconectado (Total clientes: {len(connected_clients)})")

class UdpOscProtocol(asyncio.DatagramProtocol):
    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        # Cuando se recibe un paquete UDP OSC desde TouchDesigner/Resolume
        if not connected_clients:
            return
            
        # Reenviar de forma asíncrona a todos los clientes WebSocket conectados
        for ws in list(connected_clients):
            asyncio.create_task(self.safe_send(ws, data))
            
    async def safe_send(self, ws, data):
        try:
            await ws.send(data)
        except Exception:
            pass

async def main():
    parser = argparse.ArgumentParser(description="MotorVisuales OSC WebSocket Gateway")
    parser.add_argument("--ws-port", type=int, default=8089, help="Puerto WebSocket (por defecto: 8089)")
    parser.add_argument("--udp-ip", type=str, default="127.0.0.1", help="IP destino UDP (TouchDesigner/Resolume)")
    parser.add_argument("--udp-out", type=int, default=9000, help="Puerto UDP destino (TouchDesigner/Resolume)")
    parser.add_argument("--udp-in", type=int, default=9001, help="Puerto UDP escucha para recibir OSC entrante")
    args = parser.parse_args()

    global WS_PORT, TARGET_UDP_IP, TARGET_UDP_PORT, LISTEN_UDP_PORT, udp_sock
    WS_PORT = args.ws_port
    TARGET_UDP_IP = args.udp_ip
    TARGET_UDP_PORT = args.udp_out
    LISTEN_UDP_PORT = args.udp_in

    print("=================================================================")
    print(" ⚡ MOTORVISUALES — PASARELA OSC <-> WEBSOCKETS (GATEWAY PRO)")
    print("=================================================================")
    print(f" [WS] Servidor WebSocket activo en:  ws://localhost:{WS_PORT}")
    print(f" [UDP] Reenvío hacia TD/Resolume:    udp://{TARGET_UDP_IP}:{TARGET_UDP_PORT}")
    print(f" [UDP] Escucha de comandos externos: udp://0.0.0.0:{LISTEN_UDP_PORT}")
    print("-----------------------------------------------------------------")
    print(" Listo para transmitir telemetría, stems y bus Q hacia software VJ.")
    print(" Presione Ctrl+C para finalizar.")
    print("=================================================================")

    # Socket UDP para envío saliente
    udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    # Iniciar servidor UDP de recepción
    loop = asyncio.get_running_loop()
    await loop.create_datagram_endpoint(
        lambda: UdpOscProtocol(),
        local_addr=('0.0.0.0', LISTEN_UDP_PORT)
    )

    # Iniciar servidor WebSocket
    async with websockets.serve(ws_handler, "0.0.0.0", WS_PORT):
        await asyncio.Future()  # Mantener corriendo

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[INFO] Pasarela OSC detenida limpiamente.")
