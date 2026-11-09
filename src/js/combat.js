import { toast } from './dom.js';
import { PI, rnd, angDiff, tmp } from './math.js';
import { mat, box, hgt } from './world.js';
import { need } from './save.js';

const BUL = { dmg: 20, fix: 1, kb: 2.5, hs: .03 };

export const TY = {
    S: { hp: 22, sp: 5.2, dmg: 5, wind: .28, reach: 1.5, sc: .62, xp: 10, co: 1, kb: 1, rec: .7, cd: .6, col: 0x16201a },
    M: { hp: 55, sp: 3.2, dmg: 11, wind: .6, reach: 2.3, sc: 1, xp: 25, co: 2, kb: 1, rec: .8, cd: 1.2, col: 0x2b2c1e },
    L: { hp: 130, sp: 1.9, dmg: 22, wind: 1, reach: 3, sc: 1.45, xp: 60, co: 5, kb: .35, rec: 1.1, cd: 1.8, col: 0x2a1f18 },
    W: { hp: 70, sp: 3.6, dmg: 11, wind: .5, reach: 2.2, sc: 1.25, xp: 30, co: 3, kb: .6, rec: .8, cd: 1.1, col: 0x1a1020 }, B: { hp: 520, sp: 2.3, dmg: 30, wind: .9, reach: 3.6, sc: 2.3, xp: 400, co: 40, kb: .1, rec: .9, cd: 1.5, col: 0x1a1020 }, A: { hp: 34, sp: 2.8, dmg: 9, wind: .9, reach: 11.5, sc: .82, xp: 18, co: 2, kb: .8, rec: 1.1, cd: 2.1, col: 0x3b2920 }, F: { hp: 30, sp: 6.2, dmg: 8, wind: .3, reach: 1.5, sc: .7, xp: 16, co: 2, kb: 1, rec: .6, cd: .8, col: 0x75463e }, G: { hp: 190, sp: 1.7, dmg: 24, wind: 1.05, reach: 2.8, sc: 1.5, xp: 85, co: 6, kb: .25, rec: 1.2, cd: 2, col: 0xb6a3a2 }, K: { hp: 62, sp: 2.6, dmg: 12, wind: .95, reach: 12, sc: 1.05, xp: 45, co: 4, kb: .7, rec: 1.1, cd: 2.2, col: 0xaaa18a }
};
const BURN_PCT = .25;
const gm = new THREE.MeshBasicMaterial({ color: 0x58ff7a }), cg = new THREE.CylinderGeometry(.22, .22, .06, 10), cm = new THREE.MeshStandardMaterial({ color: 0xf0b830, metalness: .6, roughness: .4 });

export function bindCombat(game) {
    game.gainXp = (n) => gainXp(game, n);
    game.kill = (e) => kill(game, e);
    game.hitEnemy = (e, a, nx, nz) => hitEnemy(game, e, a, nx, nz);
    game.mkEnemy = (x, z, type, up, df, o) => mkEnemy(game, x, z, type, up, df, o);
    game.updBullets = (dt) => updBullets(game, dt);
    game.updEnemyArrows = (dt) => updEnemyArrows(game, dt);
    game.updRunes = (dt) => updRunes(game, dt);
    game.updBurn = (dt) => updBurn(game, dt);
    game.updEnemy = (e, dt) => updEnemy(game, e, dt);
}

function gainXp(game, n) {
    const { pl, playSfx, spark } = game;
    pl.xp += n; playSfx('xp'); while (pl.xp >= need(pl.lv)) { pl.xp -= need(pl.lv); pl.lv++; pl.max += 10; pl.hp = pl.max; pl.skills.points = (pl.skills.points || 0) + 1; try { localStorage.setItem('sw_skills', JSON.stringify(pl.skills)) } catch (e) { } toast('Nível ' + pl.lv + ' · +1 ponto de habilidade'); playSfx('level'); spark(tmp.set(pl.x, pl.y + 1, pl.z), 0xffd35a, 24, 5, .2, 2) }
}

function kill(game, e) {
    const { playSfx, scene, coinsA } = game;
    e.dead = true; e.dt = 0; playSfx('hurtnpc', .65); if (e.clone) return; game.gainXp(e.T.xp); const n = Math.min(e.T.co, 8), v = Math.ceil(e.T.co / n); for (let i = 0; i < n; i++) { const c = new THREE.Mesh(cg, cm); c.userData.v = v; c.rotation.x = PI / 2; c.position.set(e.x + rnd(-1, 1), .5, e.z + rnd(-1, 1)); scene.add(c); coinsA.push(c) }
}

function hitEnemy(game, e, a, nx, nz) {
    const { pl, spark, txt, playSfx } = game;
    const T = e.T; if (!e.marked && !e.clone) { e.marked = true; const mr = new THREE.Mesh(new THREE.RingGeometry(.92, 1, 40), new THREE.MeshBasicMaterial({ color: 0xff2a2a, side: THREE.DoubleSide, transparent: true, opacity: .9, depthWrite: false })); mr.rotation.x = -PI / 2; mr.position.y = .08; e.g.add(mr) } let d = a.fix ? a.dmg : Math.round(a.dmg * rnd(.9, 1.1)); const swordSkills = pl.weapon === 0; const stage = swordSkills ? (pl.skills.swordPath === 'fire' ? (pl.skills.fireStage || 0) : pl.skills.swordPath === 'storm' ? (pl.skills.stormStage || 0) : 0) : 0; if (stage) d = Math.round(d * (1 + stage * .08)); if (e.arm && !a.ignoreArmor) d = Math.max(1, Math.round(d * (e.state === 'wind' ? .4 : .65))); e.hp -= d;
    e.kx = nx * a.kb * 3 * T.kb; e.kz = nz * a.kb * 3 * T.kb; const big = e.type === 'L' || e.boss; e.stun = big ? (a.heavy && e.type === 'L' ? .35 : 0) : (a.heavy ? .55 : .3); if (swordSkills && pl.skills.swordPath === 'fire') e.stun = 0;
    if (e.stun > 0 && e.state === 'wind') { e.state = 'chase'; e.cd = .5; e.struck = 0 } if (e.state === 'patrol') e.state = 'chase';
    game.hitstop = a.hs !== undefined ? a.hs : (a.heavy ? .11 : .06); game.shake = a.heavy ? .55 : .25; playSfx('hurtnpc', a.heavy ? 1.15 : .8);
    spark(tmp.set(e.x, 1.4, e.z), a.heavy ? 0xffd35a : 0xff7a3a, a.heavy ? 18 : 10, 6, .14); spark(tmp.set(e.x, 1.4, e.z), 0x58ff7a, 5, 3, .12); if (swordSkills && pl.skills.swordPath === 'fire') spark(tmp.set(e.x, 1.2, e.z), 0xff7138, 8, 4, .12, 1); if (swordSkills && pl.skills.swordPath === 'storm') spark(tmp.set(e.x, 1.2, e.z), 0x55dfff, 8, 4, .12, 1); txt(d, tmp.set(e.x, 2.6 * T.sc, e.z), a.heavy ? '#ffd35a' : '#fff');
    if (e.hp <= 0) game.kill(e); else if (swordSkills && pl.skills.swordPath === 'fire') { e.burnTicks = 3; e.burnTick = 0; e.burnDmg = Math.max(1, Math.round(d * BURN_PCT)) }
}

function explosiveBlast(game, x, z) {
    const { scene, spark, playSfx, enemies } = game;
    const pos = tmp.set(x, .55, z); const ring = new THREE.Mesh(new THREE.RingGeometry(.35, 2.8, 32), new THREE.MeshBasicMaterial({ color: 0xff8a26, transparent: true, opacity: .95, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -PI / 2; ring.position.copy(pos); scene.add(ring); const light = new THREE.PointLight(0xff7a20, 5, 10); light.position.set(x, 1, z); scene.add(light); spark(pos, 0xffb13b, 36, 10, .28, 1); spark(pos, 0xffe6a0, 22, 7, .18, 1); playSfx('bomba'); game.shake = .75; let t = 0; const anim = () => { t += .04; ring.scale.setScalar(1 + t * 1.6); ring.material.opacity = Math.max(0, .95 - t * .9); light.intensity = Math.max(0, 5 - t * 7); if (t >= 1) { scene.remove(ring); scene.remove(light) } else requestAnimationFrame(anim) }; requestAnimationFrame(anim); for (const e of enemies) { if (e.dead || e.clone) continue; if (Math.hypot(e.x - x, e.z - z) <= 3.2) { e.hp = 0; game.kill(e) } }
}

function updBullets(game, dt) {
    const { bullets, enemies, cols, scene, spark } = game;
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; let dead = false; const n = Math.ceil(38 * dt / .3) || 1, sx = b.vx * dt / n, sz = b.vz * dt / n;
        for (let k = 0; k < n && !dead; k++) {
            b.m.position.x += sx; b.m.position.z += sz;
            for (const e of enemies) { if (e.dead) continue; if (Math.hypot(e.x - b.m.position.x, e.z - b.m.position.z) < .6) { const l = Math.hypot(b.vx, b.vz); if (b.explosive && Math.random() < .35) explosiveBlast(game, b.m.position.x, b.m.position.z); else game.hitEnemy(e, BUL, b.vx / l, b.vz / l); dead = true; break } }
            if (!dead) for (const c of cols) if (Math.hypot(c.x - b.m.position.x, c.z - b.m.position.z) < c.r) { spark(b.m.position, 0xd9b27c, 5, 3, .1); dead = true; break }
        }
        b.l -= dt; if (dead || b.l <= 0) { scene.remove(b.m); bullets.splice(i, 1) }
    }
}

function updEnemyArrows(game, dt) {
    const { enemyArrows, pl, enemies, scene, spark, playSfx } = game;
    for (let i = enemyArrows.length - 1; i >= 0; i--) {
        const a = enemyArrows[i]; a.m.position.x += a.vx * dt; a.m.position.z += a.vz * dt; a.life -= dt; const dx = pl.x - a.m.position.x, dz = pl.z - a.m.position.z, dist = Math.hypot(dx, dz);
        if (pl.skills.repel && dist < 1.9 && pl.state === 'attack') { let target = enemies.filter(e => !e.dead && !e.clone).sort((u, v) => Math.hypot(u.x - a.m.position.x, u.z - a.m.position.z) - Math.hypot(v.x - a.m.position.x, v.z - a.m.position.z))[0]; if (target) { const vx = target.x - a.m.position.x, vz = target.z - a.m.position.z, l = Math.hypot(vx, vz) || 1; a.vx = vx / l * 23; a.vz = vz / l * 23; a.damage = 24; a.reflected = true; a.m.material.color.setHex(0x63eaff); spark(a.m.position, 0x63eaff, 12, 4, .15); playSfx('shield'); continue } }
        if (dist < .65 && pl.state !== 'dead' && !a.reflected) { game.hurtPlayer(a.damage, dx / (dist || 1), dz / (dist || 1)); a.life = 0 }
        if (a.reflected) { const hit = enemies.find(e => !e.dead && Math.hypot(e.x - a.m.position.x, e.z - a.m.position.z) < .75); if (hit) { game.hitEnemy(hit, { dmg: a.damage, fix: 1, kb: 3, heavy: 1, hs: .08 }, a.vx / 23, a.vz / 23); a.life = 0 } }
        if (a.life <= 0) { scene.remove(a.m); enemyArrows.splice(i, 1) }
    }
}

function mkFire(e) { const f = new THREE.Group(), cs = [0xff3a12, 0xff8a1e, 0xffc93a, 0xff5a1a, 0xff9a2a]; f.userData.p = []; for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.2, .75, 6), new THREE.MeshBasicMaterial({ color: cs[i], transparent: true, opacity: .85, depthWrite: false })); const a = i / 5 * 2 * PI; c.position.set(Math.sin(a) * .38, 1.1 + (i % 3) * .32, Math.cos(a) * .3); f.add(c); f.userData.p.push(c) } e.g.add(f); e.fire = f }

function updBurn(game, dt) {
    const { enemies, spark, txt, pl } = game;
    for (const e of enemies) {
        if (e.dead || !(e.burnTicks > 0)) { if (e.fire) e.fire.visible = false; continue }
        if (!e.fire) mkFire(e); e.fire.visible = true; e.fire.userData.p.forEach((c, i) => { const s = 1 + .35 * Math.sin(pl.t * 14 + i * 1.7); c.scale.set(.9 + .2 * Math.sin(pl.t * 11 + i), s, .9 + .2 * Math.cos(pl.t * 9 + i)); c.rotation.y += dt * 5 });
        if (Math.random() < .35) spark(tmp.set(e.x + rnd(-.4, .4), 1.4 * e.T.sc, e.z + rnd(-.4, .4)), Math.random() < .5 ? 0xff6a1a : 0xffc93a, 1, 2, .12, -2);
        e.burnTick += dt; if (e.burnTick >= 1) { e.burnTick -= 1; e.burnTicks--; e.hp -= e.burnDmg; txt(e.burnDmg, tmp.set(e.x, 2.4 * e.T.sc, e.z), '#ff7a2a'); if (e.hp <= 0) { e.fire.visible = false; game.kill(e) } }
    }
}

function rune(game, x, z) {
    const { scene, runes, playSfx } = game;
    const m = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.6, 24), new THREE.MeshBasicMaterial({ color: 0xffd35a, side: THREE.DoubleSide, transparent: true, opacity: .8 })); m.rotation.x = -PI / 2; m.position.set(x, hgt(x, z) + .1, z); scene.add(m); runes.push({ x, z, t: 0, m }); playSfx('magic')
}

function updRunes(game, dt) {
    const { runes, scene, spark, playSfx, pl } = game;
    for (let i = runes.length - 1; i >= 0; i--) {
        const r = runes[i]; r.t += dt;
        if (r.t < 1.3) r.m.material.color.setHex(Math.floor(r.t * 8) % 2 ? 0xffd35a : 0x58ff7a);
        else if (!r.fired) {
            r.fired = 1; r.m.material.color.setHex(0x58ff7a); r.m.scale.setScalar(1.15); spark(tmp.set(r.x, .5, r.z), 0x58ff7a, 16, 4, .15); playSfx('danoeletrico');
            if (Math.hypot(pl.x - r.x, pl.z - r.z) < 1.6 && pl.iframe <= 0 && pl.state !== 'dead') { pl.para = 1.3; game.hurtPlayer(4, 0, 0); toast('Paralisado!') }
        }
        if (r.t > 1.7) { scene.remove(r.m); runes.splice(i, 1) }
    }
}

function special(game, e) {
    const { enemies, spark, pl } = game;
    const c = enemies.filter(o => o.clone).length;
    if (e.type === 'S' && c < 4) { for (let i = 0; i < 2; i++)game.mkEnemy(e.x + rnd(-1.5, 1.5), e.z + rnd(-1.5, 1.5), 'S', false, game.waves.df(), { clone: true, life: 8 }).state = 'chase'; spark(tmp.set(e.x, 1, e.z), 0x58ff7a, 14, 4, .15) }
    else if (e.type === 'M') rune(game, pl.x, pl.z);
    else if (e.boss && c < 4) { for (let i = 0; i < 2; i++)game.mkEnemy(e.x + rnd(-3, 3), e.z + rnd(-3, 3), 'S', false, game.waves.df(), { clone: true, life: 14 }).state = 'chase' }
}

function strike(game, e, dx, dz, d) {
    const { pl, scene, enemyArrows, spark, playSfx } = game;
    const T = e.T, big = e.type === 'L' || e.boss; if (e.type === 'A' || e.type === 'K') { const v = new THREE.Vector3(pl.x - e.x, 1.1, pl.z - e.z).normalize(); const m = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .3, 6), new THREE.MeshBasicMaterial({ color: 0xffd36b })); spark(tmp.set(e.x + Math.sin(e.face) * .6, 1.3, e.z + Math.cos(e.face) * .6), 0xffc46a, 6, 4, .12, 3); m.position.set(e.x, 1.35, e.z); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); scene.add(m); enemyArrows.push({ m, vx: v.x * 15, vz: v.z * 15, life: 2.2, damage: Math.round(T.dmg * e.dmgM) }); playSfx('trabuco', .7); return } let hit;
    if (e.boss) { hit = d < 5; game.shake = .6 } else if (e.type === 'L') hit = d < T.reach + .8 && Math.abs(angDiff(Math.atan2(dx, dz), e.face)) < 1.2; else hit = d < T.reach + .7;
    spark(tmp.set(e.x + dx / d * 1.2, 1, e.z + dz / d * 1.2), 0x58ff7a, big ? 16 : 6, 3, .14); playSfx('swordnpc', big ? 1.15 : .8);
    if (hit) game.hurtPlayer(Math.round(T.dmg * e.dmgM), dx / d, dz / d)
}

function mkEnemy(game, x, z, type, up, df, o) {
    const { scene, enemies } = game;
    o = o || {}; const T = TY[type], g = new THREE.Group(), v = new THREE.Group(); g.add(v); g.scale.setScalar(T.sc * (o.clone ? .85 : 1)); const dk = T.col;
    const body = new THREE.Mesh(type === 'G' ? new THREE.SphereGeometry(.78, 9, 7) : new THREE.CylinderGeometry(.22, .38, 1.3, 6), mat(dk)); body.position.y = type === 'G' ? 1.05 : 1.15; if (type === 'G') body.scale.set(1.1, 1.05, .95);
    const hd = new THREE.Mesh(type === 'F' ? new THREE.SphereGeometry(.31, 8, 6) : new THREE.SphereGeometry(type === 'G' ? .42 : .25, 7, 5), mat(dk)); hd.position.y = type === 'G' ? 2.05 : type === 'F' ? 1.9 : 2; hd.scale.set(type === 'F' ? 1.35 : .9, type === 'F' ? 1.25 : type === 'G' ? 1.1 : 1.2, .9);
    if (type === 'F') { for (const side of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(.13, .62, 5), mat(dk)); ear.position.set(side * .22, 2.35, .02); ear.rotation.z = -side * .22; v.add(ear) } const jaw = new THREE.Mesh(new THREE.ConeGeometry(.2, .32, 5), mat(0x3a1715)); jaw.position.set(0, 1.7, .23); v.add(jaw) } if (type === 'G') { for (let j = 0; j < 7; j++) { const spike = new THREE.Mesh(new THREE.ConeGeometry(.13, .35, 5), mat(0x8b7775)); spike.position.set(rnd(-.62, .62), 1.6 + rnd(-.2, .6), rnd(-.45, .45)); spike.rotation.z = rnd(-.5, .5); v.add(spike) } const mouth = new THREE.Mesh(new THREE.BoxGeometry(.52, .18, .12), mat(0x321313)); mouth.position.set(0, 1.88, .37); v.add(mouth); for (let j = 0; j < 5; j++) { const tooth = new THREE.Mesh(new THREE.ConeGeometry(.045, .22, 4), mat(0xe8dfc8)); tooth.position.set(-.2 + j * .1, 1.78, .44); tooth.rotation.x = PI; v.add(tooth) } } if (type === 'K') { const skull = new THREE.Mesh(new THREE.SphereGeometry(.26, 7, 6), mat(0xd8cfb5)); skull.position.set(0, 2.02, .02); v.add(skull); const helm = new THREE.Mesh(new THREE.ConeGeometry(.32, .42, 5), mat(0x493a2c)); helm.position.set(0, 2.34, 0); v.add(helm); }
    const e1 = new THREE.Mesh(new THREE.BoxGeometry(.09, .05, .05), gm); e1.position.set(-.1, 2.05, .2); const e2 = e1.clone(); e2.position.x = .1;
    const ru = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, .03), gm); ru.position.set(0, 1.4, .3); v.add(body, hd, e1, e2, ru); if (type === 'A' || type === 'K') { const pg = new THREE.Group(); pg.position.set(.44, 1.2, .2); v.add(pg); box(.07, .14, .08, 0x6b3f1f, 0, -.06, -.04, pg); box(.06, .07, .42, 0x2b2b30, 0, .03, .2, pg); box(.09, .04, .1, 0xb08a3a, 0, .0, 0, pg); if (type === 'A') { const hb = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .03, 10), mat(0x4a3322)); hb.position.y = 2.2; const hc = new THREE.Mesh(new THREE.CylinderGeometry(.15, .19, .2, 8), mat(0x4a3322)); hc.position.y = 2.3; v.add(hb, hc) } }
    const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .38, 1.65, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(.1, 1, .1), mat(dk)); m.position.y = -.5; const c = new THREE.Mesh(new THREE.ConeGeometry(.08, .35, 4), gm); c.position.y = -1.15; c.rotation.x = PI; a.add(m, c); v.add(a); return a });
    const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .16, .6, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .6, .12), mat(dk)); m.position.y = -.3; l.add(m); v.add(l); return l });
    let bossWolfParts = null;
    if (type === 'B' || type === 'W') {
        [body, hd, e1, e2, ru, ...arms, ...legs].forEach(o => o.visible = false);
        const fur = mat(0x342b2b), furDark = mat(0x171416), muzzleMat = mat(0x5a4140), eyeMat = new THREE.MeshStandardMaterial({ color: 0xff321e, emissive: 0xc51a0b, emissiveIntensity: 2 });
        const torsoW = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.05, 1.95), fur); torsoW.position.set(0, 1.5, -.02); torsoW.rotation.x = -.08; v.add(torsoW);
        const chest = new THREE.Mesh(new THREE.SphereGeometry(.64, 10, 8), furDark); chest.scale.set(1, .95, .55); chest.position.set(0, 1.45, .78); v.add(chest);
        const headW = new THREE.Group(); headW.position.set(0, 2.05, 1.0); v.add(headW);
        const skull = new THREE.Mesh(new THREE.BoxGeometry(.88, .76, .92), fur); headW.add(skull);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(.54, .36, .7), muzzleMat); snout.position.set(0, -.2, .66); headW.add(snout);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), furDark); nose.scale.set(1, .7, .8); nose.position.set(0, -.16, 1.0); headW.add(nose);
        for (const s of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(.22, .72, 5), fur); ear.position.set(s * .3, .58, -.12); ear.rotation.z = -s * .18; headW.add(ear);
            const eye = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), eyeMat); eye.position.set(s * .24, .12, .43); headW.add(eye);
            const fang = new THREE.Mesh(new THREE.ConeGeometry(.07, .28, 5), mat(0xe8d9c7)); fang.position.set(s * .2, -.36, .72); fang.rotation.x = PI; headW.add(fang);
        }
        const forelegs = [], hindlegs = [];
        for (const s of [-1, 1]) {
            const fore = new THREE.Group(); fore.position.set(s * .48, 1.35, .65); v.add(fore);
            const upper = new THREE.Mesh(new THREE.BoxGeometry(.34, .82, .42), fur); upper.position.y = -.32; fore.add(upper);
            const paw = new THREE.Mesh(new THREE.BoxGeometry(.4, .24, .48), furDark); paw.position.set(0, -.78, .16); fore.add(paw);
            for (let c = 0; c < 3; c++) { const claw = new THREE.Mesh(new THREE.ConeGeometry(.055, .28, 5), mat(0xd9d0c5)); claw.position.set((c - 1) * .12, -.82, .38); claw.rotation.x = PI / 2; fore.add(claw) }
            forelegs.push(fore);
            const hind = new THREE.Group(); hind.position.set(s * .48, 1.05, -.72); v.add(hind);
            const thigh = new THREE.Mesh(new THREE.BoxGeometry(.48, .78, .62), fur); thigh.position.y = -.2; hind.add(thigh);
            const hock = new THREE.Mesh(new THREE.BoxGeometry(.28, .65, .3), furDark); hock.position.set(0, -.65, -.05); hind.add(hock);
            hindlegs.push(hind);
        }
        const tail = new THREE.Group(); tail.position.set(0, 1.65, -.95); v.add(tail);
        const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(.22, 1.05, 7), fur); tailMesh.rotation.x = -PI / 2; tailMesh.position.z = -.48; tail.add(tailMesh);
        bossWolfParts = { headW, forelegs, hindlegs, tail, torsoW };
    }
    if (up) { const r = new THREE.Mesh(new THREE.RingGeometry(.7, .88, 20), new THREE.MeshBasicMaterial({ color: 0x58ff7a, side: THREE.DoubleSide })); r.rotation.x = -PI / 2; r.position.y = .05; g.add(r); if (type === 'L') for (const s of [-1, 1]) box(.5, .28, .5, 0x6a6f66, s * .45, 1.75, 0, v) }
    g.traverse(m => { if (m.isMesh) m.castShadow = true });
    if (o.clone) g.traverse(m => { if (m.isMesh && m.material !== gm) { m.material.transparent = true; m.material.opacity = .45 } });
    scene.add(g); const hp = o.clone ? 8 : T.hp * df.hp * (up ? 1.4 : 1);
    const e = { g, v, arms, legs, bossWolfParts, x, z, hx: x, hz: z, type, T, up, id: game.eid++, boss: type === 'B', archer: type === 'A' || type === 'K', arm: up && (type === 'L' || type === 'B'), clone: !!o.clone, life: o.life || 0, hp, max: hp, dmgM: df.dmg * (o.clone ? .5 : 1), spM: df.sp, state: 'patrol', face: rnd(0, 6), kx: 0, kz: 0, stun: 0, t: 0, cd: rnd(0, 1), sp2: rnd(3, 6), dead: false, dt: 0, tx: x, tz: z, w: 0, struck: 0, pt: 0, bossIntro: type === 'B' ? 2.8 : 0, bossRunT: 0, bossRunCd: rnd(4, 7), bossHowlCd: rnd(5, 10), bossBaseScale: T.sc };
    enemies.push(e); return e
}

function updEnemy(game, e, dt) {
    const { pl, enemies, scene, spark, push, hgt, PT, audio } = game;
    const T = e.T;
    if (e.dead) { e.dt += dt; e.v.rotation.x = Math.max(-1.5, -e.dt * 6); if (e.dt > 1.5) { scene.remove(e.g); enemies.splice(enemies.indexOf(e), 1) } return }
    if (e.boss && e.bossIntro > 0) {
        e.bossIntro = Math.max(0, e.bossIntro - dt); const k = 1 - e.bossIntro / 2.8;
        const ease = 1 - Math.pow(1 - k, 3); e.g.scale.setScalar(e.bossBaseScale * Math.max(.001, ease));
        e.g.position.set(e.x, hgt(e.x, e.z) - 1.8 * (1 - ease), e.z);
        e.v.rotation.x = -.18 * (1 - ease);
        if (!e.bossIntroFx) {
            e.bossIntroFx = true; audio.wolfHowl(); spark(tmp.set(e.x, .25, e.z), 0x9b2727, 34, 7, .35, -2); game.shake = 1.1;
            const ring = new THREE.Mesh(new THREE.RingGeometry(.5, 1.1, 32), new THREE.MeshBasicMaterial({ color: 0x9b2727, transparent: true, opacity: .9, side: THREE.DoubleSide }));
            ring.rotation.x = -PI / 2; ring.position.set(e.x, .08, e.z); scene.add(ring); PT.push({ m: ring, v: new THREE.Vector3(0, 0, 0), l: 1.1, g: 0 });
        }
        if (e.bossIntro <= 0) { e.g.scale.setScalar(e.bossBaseScale); e.v.rotation.x = 0; e.state = 'chase'; }
        return;
    }
    if (e.boss) { e.bossHowlCd -= dt; if (e.bossHowlCd <= 0) { audio.playBossHowl(); e.bossHowlCd = rnd(9, 16) } }
    if (e.clone) { e.life -= dt; if (e.life <= 0) { e.dead = true; e.dt = 0; spark(tmp.set(e.x, 1, e.z), 0x58ff7a, 8, 3, .12); return } }
    e.x += e.kx * dt; e.z += e.kz * dt; const f = Math.exp(-9 * dt); e.kx *= f; e.kz *= f; e.cd -= dt;
    const dx = pl.x - e.x, dz = pl.z - e.z, d = Math.hypot(dx, dz) || 1, alive = pl.state !== 'dead', sp = T.sp * e.spM; let vx = 0, vz = 0, walk = false, tf = e.face;
    if (e.stun > 0) { e.stun -= dt; e.arms.forEach(a => a.rotation.x = .8) }
    else if (e.state === 'patrol') { e.pt += dt; if (Math.hypot(e.tx - e.x, e.tz - e.z) < 1 || e.t <= 0) { e.tx = e.hx + rnd(-7, 7); e.tz = e.hz + rnd(-7, 7); e.t = rnd(2, 4) } e.t -= dt; const ax = e.tx - e.x, az = e.tz - e.z, l = Math.hypot(ax, az) || 1; vx = ax / l * 1.6; vz = az / l * 1.6; tf = Math.atan2(ax, az); walk = true; if ((d < 22 || e.pt > 2.2) && alive) e.state = 'chase' }
    else if (e.state === 'chase') {
        tf = Math.atan2(dx, dz); const orbit = e.type === 'S' ? Math.sin(pl.t * 2.2 + e.id) * .55 : e.type === 'M' ? Math.sin(pl.t * 1.35 + e.id) * .22 : 0; let chaseSp = sp; if (e.boss) { e.bossRunCd -= dt; if (e.bossRunT > 0) e.bossRunT = Math.max(0, e.bossRunT - dt); if (e.bossRunCd <= 0 && d > 5) { e.bossRunT = 2.15; e.bossRunCd = rnd(6, 9) } if (e.bossRunT > 0) chaseSp = 6.4; else chaseSp = 2.25; } vx = (dx / d - dz / d * orbit) * chaseSp; vz = (dz / d + dx / d * orbit) * chaseSp; walk = true;
        const keepOut = (e.type === 'A' || e.type === 'K') ? 8 : e.type === 'S' ? .9 : e.type === 'M' ? 1.35 : 1.8; if (d < keepOut) { vx *= .12; vz *= .12 } else if (d > T.reach * 1.25) { vx *= 1.12; vz *= 1.12 }
        if (((e.type === 'A' || e.type === 'K') ? d < T.reach && d > 5 : d < T.reach * .9) && e.cd <= 0 && alive) { if (enemies.filter(o => o.state === 'wind').length < game.waves.atkMax) { e.state = 'wind'; e.t = 0; e.struck = 0 } else { vx = -dz / d * sp * .5; vz = dx / d * sp * .5 } }
        if (e.up && alive && e.type !== 'L') { e.sp2 -= dt; if (e.sp2 <= 0) { e.sp2 = e.boss ? 9 : 7; special(game, e) } }
        if (d > 30) e.state = 'patrol'
    }
    else if (e.state === 'wind') {
        e.t += dt; tf = Math.atan2(dx, dz); const k = e.t / T.wind; e.arms.forEach(a => a.rotation.x = k < 1 ? -2.6 * k : -1.1);
        if (!e.struck && k >= 1) { e.struck = 1; strike(game, e, dx, dz, d) } if (e.t >= T.wind + .25) { e.state = 'recover'; e.t = 0; e.struck = 0 }
    }
    else if (e.state === 'recover') { e.t += dt; if (e.type === 'S') { vx = -dx / d * 4; vz = -dz / d * 4 } if (e.t >= T.rec) { e.state = 'chase'; e.cd = T.cd } }
    if (e.state !== 'wind' && e.stun <= 0) e.arms.forEach(a => a.rotation.x *= .8);
    const oldX = e.x, oldZ = e.z; e.x += vx * dt; e.z += vz * dt; push(e, .4 * T.sc);
    if (e.state === 'chase' && Math.hypot(e.x - oldX, e.z - oldZ) < Math.hypot(vx, vz) * dt * .32) { const side = Math.sin(e.id * 17.13) >= 0 ? 1 : -1; e.x = oldX + Math.cos(e.face) * side * sp * dt * .8; e.z = oldZ - Math.sin(e.face) * side * sp * dt * .8; push(e, .4 * T.sc) }
    for (const o of enemies) if (o !== e && !o.dead) { const ox = e.x - o.x, oz = e.z - o.z, od = Math.hypot(ox, oz); if (od < 1.05 && od > 1e-4) { e.x += ox / od * .045; e.z += oz / od * .045 } }
    e.face += angDiff(tf, e.face) * Math.min(1, 10 * dt); e.w += dt * (walk ? (e.boss && e.bossRunT > 0 ? 15 : 6) : 0); e.legs[0].rotation.x = Math.sin(e.w) * .7; e.legs[1].rotation.x = -Math.sin(e.w) * .7;
    if (e.bossWolfParts) { const p = e.bossWolfParts, amp = e.bossRunT > 0 ? .95 : .42; p.forelegs[0].rotation.x = Math.sin(e.w) * amp; p.forelegs[1].rotation.x = -Math.sin(e.w) * amp; p.hindlegs[0].rotation.x = -Math.sin(e.w) * amp; p.hindlegs[1].rotation.x = Math.sin(e.w) * amp; p.headW.rotation.x = e.state === 'wind' ? .32 : Math.sin(e.w * .5) * .06; p.tail.rotation.x = Math.sin(e.w * .65) * .25; p.torsoW.position.y = 1.5 + (e.bossRunT > 0 ? Math.abs(Math.sin(e.w)) * .13 : Math.sin(e.w) * .025); }
    e.v.scale.setScalar(e.state === 'wind' ? 1 + .12 * Math.min(1, e.t / T.wind) : 1); e.g.position.set(e.x, hgt(e.x, e.z), e.z); e.g.rotation.y = e.face
}
