#!/usr/bin/env python3
"""Small read-only probe for the Raspberry Pi: CPU, temperature, memory, disk, uptime, internet.

Standard library only. It serves one JSON document on GET /status and nothing else
(no secrets, no writes). The API (apps/api) reads it for the admin System page.

Run by tools/pi-probe/deploy.sh inside a container that already exists on the Pi
(the Home Assistant image has Python), with the host's root disk mounted read-only
at /hostroot. /proc and /sys show the host's values inside a container.
"""

import json
import os
import socket
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PROBE_PORT", "8788"))
DISK_PATH = os.environ.get("PROBE_DISK_PATH", "/hostroot")
INTERNET_HOST = ("1.1.1.1", 443)


def cpu_times():
    with open("/proc/stat") as f:
        parts = [int(x) for x in f.readline().split()[1:]]
    idle = parts[3] + parts[4]  # idle + iowait
    return idle, sum(parts)


def cpu_percent(window=0.4):
    idle1, total1 = cpu_times()
    time.sleep(window)
    idle2, total2 = cpu_times()
    total = total2 - total1
    return round(100 * (1 - (idle2 - idle1) / total)) if total > 0 else 0


def temperature_c():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp") as f:
            return round(int(f.read()) / 1000, 1)
    except (OSError, ValueError):
        return None


def memory():
    info = {}
    with open("/proc/meminfo") as f:
        for line in f:
            key, value = line.split(":")
            info[key] = int(value.split()[0])  # kB
    total = info["MemTotal"]
    used = total - info["MemAvailable"]
    return {"totalMb": round(total / 1024), "usedMb": round(used / 1024), "percent": round(100 * used / total)}


def disk():
    st = os.statvfs(DISK_PATH)
    total = st.f_blocks * st.f_frsize
    used = (st.f_blocks - st.f_bfree) * st.f_frsize
    usable = used + st.f_bavail * st.f_frsize  # like df: percent of what a user can use
    gb = 1000**3
    return {"totalGb": round(total / gb, 1), "usedGb": round(used / gb, 1), "percent": round(100 * used / usable)}


def uptime_seconds():
    with open("/proc/uptime") as f:
        return int(float(f.read().split()[0]))


def internet():
    start = time.monotonic()
    try:
        with socket.create_connection(INTERNET_HOST, timeout=1.5):
            pass
        return {"reachable": True, "latencyMs": round((time.monotonic() - start) * 1000)}
    except OSError:
        return {"reachable": False, "latencyMs": None}


def snapshot():
    return {
        "cpuPercent": cpu_percent(),
        "tempC": temperature_c(),
        "memory": memory(),
        "disk": disk(),
        "uptimeSeconds": uptime_seconds(),
        "load1": float(open("/proc/loadavg").read().split()[0]),
        "internet": internet(),
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0] not in ("/", "/status"):
            self.send_error(404)
            return
        body = json.dumps(snapshot()).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):  # keep the container log quiet
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
