#!/bin/sh
cd /home/user/Interactive-alice
[ -f .scratch/rev1/preview.pid ] && kill "$(cat .scratch/rev1/preview.pid)" 2>/dev/null
sleep 1
setsid nohup npx vite preview --outDir /home/user/Interactive-alice/.scratch/rev1/dist --port 4321 --strictPort > .scratch/rev1/preview.log 2>&1 < /dev/null &
echo $! > .scratch/rev1/preview.pid
