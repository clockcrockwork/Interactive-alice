import fs from 'node:fs';
for (const id of process.argv.slice(2)) {
  const demo = JSON.parse(fs.readFileSync(`experience/demos/${id}.demo.json`,'utf8'));
  const ch = JSON.parse(fs.readFileSync(`text/locales/en-simple/ch${String(demo.titleChapter).padStart(2,'0')}.json`,'utf8'));
  console.log(`=== ${id}`);
  let i=0;
  for (const shot of demo.shots) for (const b of shot.beats) {
    console.log(`#${i++} [${shot.id}/${b.id}] cue=${b.cue??'-'}`);
    for (const s of b.segments) console.log(`   ${s}: ${JSON.stringify(ch.segments[s])}`);
  }
}
