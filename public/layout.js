export const plots = [];
for (const [zone, side, count] of [['A',-1,6],['B',1,7]]) {
  for (let i=0; i<count; i++) {
    const t = -1.12 + i * 4.42/(count-1);
    plots.push({ id: zone+(i+1), x: side*(25+19*Math.cos(t)), z:-8+24*Math.sin(t), angle: Math.atan2(side*Math.cos(t),Math.sin(t)) });
  }
}
