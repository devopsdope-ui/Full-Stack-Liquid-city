#!/usr/bin/env bash
set -e

echo "=== Starting Liquid City Full-Stack ==="

# 1. Clean up ports
echo "[1/4] Clearing ports 8000 and 5173..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# 2. Launch Backend
echo "[2/4] Starting FastAPI Backend on port 8000..."
cd "/Users/sk/Downloads/backend 3"
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend health
echo "Waiting for backend to be ready..."
for i in {1..15}; do
  if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "Backend is healthy!"
    break
  fi
  sleep 1
done

# 3. Launch Frontend
echo "[3/4] Starting Vite Frontend on port 5173..."
cd "/Users/sk/Downloads/liquid-city-frontend"
nohup npm run dev -- --host > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend
echo "Waiting for frontend to be ready..."
for i in {1..15}; do
  if curl -s http://localhost:5173/ >/dev/null 2>&1; then
    echo "Frontend is healthy!"
    break
  fi
  sleep 1
done

echo "[4/4] === Liquid City is LIVE! ==="
echo "Backend:  http://localhost:8000 (Swagger docs at /docs)"
echo "Frontend: http://localhost:5173"
