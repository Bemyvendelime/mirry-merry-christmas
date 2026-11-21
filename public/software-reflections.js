// A reflected ground ray is equivalent to a ray from below the ground plane.
// At each scanline, intersect it with the camera-facing tree and lamp planes.
// Processing their projected intervals avoids an objects-per-pixel search.
export function reflectedSprites(props, textures) {
  const sampled = new WeakMap();
  let row = new Uint32Array(0);
  function bitmap(image) {
    if (sampled.has(image)) return sampled.get(image);
    const c = document.createElement('canvas');
    c.height = Math.min(384, image.height);
    c.width = Math.max(1, Math.round(image.width*c.height/image.height));
    const ctx = c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(image,0,0,c.width,c.height);
    const data = new Uint32Array(ctx.getImageData(0,0,c.width,c.height).data.buffer);
    const result = {data,w:c.width,h:c.height};
    sampled.set(image,result);
    return result;
  }
  return (m, width) => {
    if (width !== row.length) row = new Uint32Array(width);
    const cards = [];
    for (const prop of props) {
      if (prop.k !== 'tree' && !prop.k.startsWith('lamp')) continue;
      const bitmapSource = textures.get(prop.k) || textures.get('lamp');
      if (!bitmapSource) continue;
      const x = prop.x-m[12], z=prop.z-m[14], depth=x*m[2]-z*m[0];
      if (depth<.1) continue;
      cards.push({depth,side:x*m[0]+z*m[2],h:prop.h,w:prop.w,img:bitmap(bitmapSource)});
    }
    cards.sort((a,b)=>b.depth-a.depth);
    return (rayX,dy,rayZ,dist,u0,step) => {
      row.fill(0);
      const forward=rayX*m[2]-rayZ*m[0], side=rayX*m[0]+rayZ*m[2];
      if (forward<=.01) return row;
      for (const card of cards) {
        const t=card.depth/forward, height=-m[13]-dy*t;
        if (t<=dist || height<=0 || height>=card.h) continue;
        const {img}=card, first=((card.side-card.w*.5)/t-side-u0)/step;
        const span=card.w/(t*step), end=Math.min(width,Math.ceil(first+span));
        const offset=Math.min(img.h-1,Math.floor((1-height/card.h)*img.h))*img.w;
        for(let x=Math.max(0,Math.ceil(first));x<end;x++){
          const pixel=img.data[offset+Math.min(img.w-1,Math.floor((x-first)*img.w/span))];
          if((pixel>>>24)>36)row[x]=pixel;
        }
      }
      return row;
    };
  };
}
