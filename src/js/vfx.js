import { rnd } from './math.js';

export function createVfx(scene, S) {
    const PT = [], pg = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 100; i++) { const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: 0xffffff })); m.visible = false; scene.add(m); PT.push({ m, l: 0, v: new THREE.Vector3(), g: 9 }) }
    let pi = 0;
    const dns = [];
    function spark(p, col, n, sp, sz, g = 9) { if (!S.fx) return; for (let i = 0; i < n; i++) { const q = PT[pi++ % PT.length]; q.m.visible = true; q.m.material.color.setHex(col); q.m.position.copy(p); q.m.scale.setScalar(sz * rnd(.6, 1.2)); q.v.set(rnd(-1, 1), rnd(.2, 1.2), rnd(-1, 1)).multiplyScalar(sp * rnd(.5, 1)); q.l = rnd(.3, .6); q.g = g } }
    function txt(v, pos, col) { if (!S.dn) return; const el = document.createElement('div'); el.className = 'dn'; el.textContent = v; el.style.color = col; document.body.appendChild(el); dns.push({ el, p: pos.clone(), t: 0 }) }
    function stepPT(dt) { for (const q of PT) if (q.l > 0) { q.l -= dt; q.v.y -= q.g * dt; q.m.position.addScaledVector(q.v, dt); q.m.scale.multiplyScalar(1 - dt * 2); if (q.l <= 0) q.m.visible = false } }
    return { PT, dns, spark, txt, stepPT };
}
