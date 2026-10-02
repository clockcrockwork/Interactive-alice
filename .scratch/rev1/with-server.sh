#!/bin/sh
# usage: with-server.sh <command...>   starts the preview, runs the command, stops the preview
cd /home/user/Interactive-alice
npx vite preview --outDir /home/user/Interactive-alice/.scratch/rev1/dist --port 4321 --strictPort > .scratch/rev1/preview.log 2>&1 < /dev/null &
PID=$!
for i in $(seq 1 20); do sleep 1; c=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/demos/riverbank/); [ "$c" = 200 ] && break; done
[ "$c" = 200 ] || { echo "server not up ($c)"; kill $PID; exit 1; }
sh -c "$*"
RC=$?
kill $PID 2>/dev/null
exit $RC
