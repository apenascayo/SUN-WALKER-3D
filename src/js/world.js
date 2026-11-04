import { $ } from './dom.js';
import { PI, rnd } from './math.js';

export const mat = c => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 1 });
export const box = (w, h, d, c, x, y, z, p) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); p.add(m); return m };

export const R = 90;
export function hgt(x, z) { const d = Math.hypot(x, z), f = Math.min(1, Math.max(0, (d - 6) / 14)); return f * (Math.sin(x * .11) * Math.cos(z * .09) * 2.2 + Math.sin(x * .23 + z * .17) * .6 + Math.max(0, Math.sin(z * .05 + 1) * 3 - 1.2)) }

export function createWorld() {
    const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(), SKY = 0xe0a063; scene.background = new THREE.Color(SKY); scene.fog = new THREE.Fog(SKY, 26, 68);
    const cam = new THREE.PerspectiveCamera(38, 1, .5, 200);
    function resize() { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() }
    addEventListener('resize', resize); resize();
    scene.add(new THREE.HemisphereLight(0xffd9a8, 0x5a3a2a, .85));
    const sun = new THREE.DirectionalLight(0xffb06a, 1.5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 }); sun.shadow.bias = -.0006; scene.add(sun, sun.target);

    {
        const g = new THREE.PlaneGeometry(2 * R, 2 * R, 100, 100); g.rotateX(-PI / 2); const p = g.attributes.position, col = [], a = new THREE.Color(0xc99558), b = new THREE.Color(0x8c5a34), s = new THREE.Color(0xe0b878), t = new THREE.Color();
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = hgt(x, z); p.setY(i, h); t.copy(a).lerp(b, Math.min(1, Math.max(0, h / 4))).lerp(s, (Math.sin(x * .4) * Math.cos(z * .35) + 1) * .12 + Math.random() * .06); col.push(t.r, t.g, t.b) }
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); m.receiveShadow = true; scene.add(m)
    }

    const cols = [], occ = [];
    function place(o, x, z, r, tall) { o.position.set(x, hgt(x, z), z); o.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true } }); scene.add(o); if (r) cols.push({ x, z, r }); if (tall) { const ms = []; o.traverse(m => { if (m.isMesh) ms.push(m.material) }); occ.push({ x, z, ms, o: 1 }) } }
    function cactus() {
        const g = new THREE.Group(), m = mat(0x587a3c), h = rnd(2, 3.6); const b = new THREE.Mesh(new THREE.CylinderGeometry(.28, .34, h, 7), m); b.position.y = h / 2; g.add(b);
        for (const s of [-1, 1]) if (Math.random() < .7) { const y = h * rnd(.4, .65), c = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .6, 6), m); c.rotation.z = PI / 2; c.position.set(s * .45, y, 0); const u = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .9, 6), m); u.position.set(s * .75, y + .4, 0); g.add(c, u) } return g
    }
    function deadTree() {
        const g = new THREE.Group(), m = mat(0x4a3526), h = rnd(2.4, 3.6); const t = new THREE.Mesh(new THREE.CylinderGeometry(.12, .26, h, 5), m); t.position.y = h / 2; g.add(t);
        for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.04, .1, 1.4, 4), m); b.position.set(Math.cos(i * 2.1) * .5, h * .8 + i * .1, Math.sin(i * 2.1) * .5); b.rotation.set(Math.sin(i * 2.1) * .9, 0, -Math.cos(i * 2.1) * .9); g.add(b) } return g
    }
    function rock() { const s = rnd(.6, 1.8), m = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), mat(0x7a6048)); m.scale.set(s, s * rnd(.5, .9), s); m.position.y = s * .3; const g = new THREE.Group(); g.add(m); g.rotation.y = rnd(0, 6); g.userData.r = s * .9; return g }
    function wall(x, z, len, rot) {
        const g = new THREE.Group(), m = mat(0xb98e63), w = new THREE.Mesh(new THREE.BoxGeometry(len, rnd(2.2, 3.2), .6), m); w.position.y = 1.4; g.add(w);
        const k = new THREE.Mesh(new THREE.BoxGeometry(len * .3, .9, .62), mat(0x8a6544)); k.position.set(len * .2, 2.8, 0); g.add(k); g.rotation.y = rot; place(g, x, z, 0, true);
        for (let i = -len / 2 + .6; i <= len / 2; i += 1.4)cols.push({ x: x + Math.cos(rot) * i, z: z - Math.sin(rot) * i, r: .8 })
    }
    function hut(x, z) { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 3), mat(0xc7a070)); b.position.y = 1.1; const r = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.6, 4), mat(0x8a4b2a)); r.position.y = 3; r.rotation.y = PI / 4; const d = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.5, .1), mat(0x3a2218)); d.position.set(0, .75, 1.52); g.add(b, r, d); place(g, x, z, 2.3, true) }
    wall(14, -8, 7, .2); wall(18, -12, 6, 1.7); wall(10, -13, 5, 1.5); wall(16, -4, 4, 1.4); hut(-15, -10); hut(-19, -4); hut(-12, -16);
    for (let i = 0; i < 150; i++) {
        const a = rnd(0, 2 * PI), d = rnd(9, R - 6), x = Math.cos(a) * d, z = Math.sin(a) * d, k = Math.random();
        if (Math.hypot(x - 14, z + 9) < 9 || Math.hypot(x + 16, z + 10) < 7) continue;
        if (k < .4) place(cactus(), x, z, .5, true); else if (k < .6) place(deadTree(), x, z, .4, true); else { const r = rock(); place(r, x, z, r.userData.r) }
    }
    const torch = new THREE.PointLight(0xff7a2a, 1.2, 14); torch.position.set(12, 3, -6); scene.add(torch);
    const push = (o, r) => { for (const c of cols) { const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > 1e-4) { o.x = c.x + dx / d * m; o.z = c.z + dz / d * m } } const d = Math.hypot(o.x, o.z), l = R - 3; if (d > l) { o.x *= l / d; o.z *= l / d } };

    const merchant = new THREE.Group(); {
        const robe = mat(0x70402d), dark = mat(0x2a211d), leather = mat(0x8a5636), cloth = mat(0xb98b61), skin = mat(0x9a6748);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(.34, .52, 1.28, 10), robe); body.position.y = .88;
        const hood = new THREE.Mesh(new THREE.SphereGeometry(.36, 12, 10), dark); hood.scale.set(.92, 1.15, .9); hood.position.set(0, 1.76, .05);
        const face = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), skin); face.scale.set(.85, 1.05, .65); face.position.set(0, 1.66, .23);
        const cloak = new THREE.Mesh(new THREE.ConeGeometry(.66, 1.45, 10, 1, true), dark); cloak.position.set(0, 1.03, -.08); cloak.rotation.x = .08;
        const pack = new THREE.Group(); const chest = new THREE.Mesh(new THREE.BoxGeometry(.66, .72, .42), leather); chest.position.set(0, 1.63, -.42); pack.add(chest);
        const lid = new THREE.Mesh(new THREE.BoxGeometry(.7, .16, .46), cloth); lid.position.set(0, 2.04, -.42); pack.add(lid);
        for (let i = 0; i < 3; i++) { const roll = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .55, 8), cloth); roll.rotation.z = PI / 2; roll.position.set((i - 1) * .19, 1.7, -.67); pack.add(roll) }
        const strap = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.5, .08), leather); strap.position.set(.22, 1.45, .22); strap.rotation.z = -.45;
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(.045, .065, 2.25, 8), leather); staff.position.set(.55, 1.05, .1); staff.rotation.z = -.08;
        const staffTop = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), cloth); staffTop.position.set(.57, 2.18, .1);
        const belt = new THREE.Mesh(new THREE.TorusGeometry(.34, .055, 6, 16), leather); belt.rotation.x = PI / 2; belt.position.y = .52;
        merchant.add(body, hood, face, cloak, pack, strap, staff, staffTop, belt);
        const robeFoldMat = mat(0x503022), seamMat = mat(0xc09a67), ornMat = mat(0x9b762e);
        for (let i = 0; i < 5; i++) { const fold = new THREE.Mesh(new THREE.ConeGeometry(.055, .72, 5), robeFoldMat); fold.position.set(-.23 + i * .115, .34, .19); fold.rotation.z = (i - 2) * .045; merchant.add(fold) }
        for (let i = 0; i < 3; i++) { const stitch = new THREE.Mesh(new THREE.BoxGeometry(.025, .22, .025), seamMat); stitch.position.set(.18 + i * .04, .58, .26); stitch.rotation.z = -.25; merchant.add(stitch) }
        const charm = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 8), ornMat); charm.position.set(-.22, .48, .31); merchant.add(charm);
        merchant.position.set(-7, hgt(-7, 6), 6); merchant.rotation.y = -.7; scene.add(merchant);
        const lamp = new THREE.PointLight(0xffb54a, 1.3, 7); lamp.position.set(-7, 2.5, 6); scene.add(lamp)
    }

    const daySky = new THREE.Color(0xe0a063), nightSky = new THREE.Color(0x111a35), dayFog = new THREE.Color(0xe0a063), nightFog = new THREE.Color(0x111a35), dayHemi = new THREE.Color(0xffd9a8), nightHemi = new THREE.Color(0x435a9a), daySun = new THREE.Color(0xffb06a), nightSun = new THREE.Color(0x8aa6ff);
    const camOff = new THREE.Vector3(0, 11, 11), camT = new THREE.Vector3();

    return { renderer, scene, cam, sun, torch, SKY, cols, occ, push, resize, merchant, daySky, nightSky, dayFog, nightFog, dayHemi, nightHemi, daySun, nightSun, camOff, camT };
}

export function applyVideo(game) {
    const { renderer, cam, sun, scene, S } = game;
    renderer.setPixelRatio(Math.min(devicePixelRatio, [1, 1.5, 2][S.q]) * S.scale); game.resize(); sun.castShadow = S.sh > 0; const m = S.sh === 1 ? 1024 : 2048; sun.shadow.mapSize.set(m, m); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null } scene.fog.far = S.far; cam.far = S.far + 30; cam.updateProjectionMatrix();
}
