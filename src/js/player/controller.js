import { $, toast, hpHit } from '../dom.js';
import { PI, rnd, angDiff, lerpPose, tmp } from '../math.js';

export const REST = { x: -.25, z: -.1, y: 0, t: 0 }, GUARD = { x: -1.02, z: -.22, y: 0, t: -.12 };
export const ATK = [
    { dur: .46, ts: .15, te: .27, dmg: 12, kb: 3.5, rng: 2.7, arc: 120, from: { x: -.6, z: 1.0, y: 0, t: .8 }, to: { x: -2.7, z: -.8, y: 0, t: -.7 }, lunge: 2.5 },
    { dur: .5, ts: .18, te: .3, dmg: 16, kb: 5, rng: 2.7, arc: 80, from: { x: -3.0, z: 0, y: 0, t: 0 }, to: { x: -1.2, z: 0, y: 0, t: 0 }, lunge: 3 },
    { dur: .62, ts: .22, te: .34, dmg: 30, kb: 9, rng: 3.3, arc: 50, heavy: 1, from: { x: -1.2, z: .1, y: 0, t: .9 }, to: { x: -1.57, z: 0, y: 0, t: -.3 }, lunge: 7 }];
export const DODGE = { duration: .40, startup: .033, iframes: .216, recovery: .151, distance: 3.6, staminaCost: 25, regenPerSecond: 18, bufferWindow: .14, cooldown: .08 };
export const SWAP = { dur: 1.05, store: .38, draw: .70 };

const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function createPlayerState(S) {
    return { x: 0, z: 2, y: 0, face: 0, hp: 100, max: 100, lv: 1, xp: 0, coins: 0, state: 'idle', t: 0, i: 0, atkT: 0, queued: false, last: -1, lastEnd: -9, buf: 0, dcd: 0, iframe: 0, st: 0, stamina: 100, staminaMax: 100, dx: 0, dz: 0, hit: new Set(), pose: { ...REST }, sp: { ...REST }, walk: 0, weapon: 0, weaponOwned: false, gunOwned: false, scytheMode: 'scythe', scytheAction: null, scytheCd: 0, ammo: 0, ammoBoxes: 0, shootCd: 0, rec: 0, combat: 0, rollSide: 1, skills: { explosive: false, lightning: false, swordPath: null, fireStage: 0, stormStage: 0, sheath: false, repel: false, points: 0 }, para: 0, potions: 0, werewolf: false, god: !!S.god, magnetLevel: 0 };
}

export function clearInputs(game) { for (const k in game.keys) delete game.keys[k]; game.want.dodge = false; game.pl.buf = 0 }

export function aimPoint(game) { ray.setFromCamera(game.mouse, game.cam); plane.constant = -game.pl.y; const v = new THREE.Vector3(); return ray.ray.intersectPlane(plane, v) }

function faceMouse(game) {
    const a = aimPoint(game), pl = game.pl;
    if (!a) return;
    const dx = a.x - pl.x, dz = a.z - pl.z;
    if (Math.hypot(dx, dz) > .3) pl.face = Math.atan2(dx, dz);
}

export function startSwap(game, w) {
    const { pl, armR } = game;
    if (pl.swapT > 0 || w === pl.weapon || pl.state === 'attack' || pl.state === 'dodge') return;
    if (w === 1 && !pl.gunOwned || w === 2 && !pl.weaponOwned) return;
    if (pl.scytheAction) return;
    if (pl.scytheThrow) clearScytheThrow(game);
    if (w === 2 || pl.weapon === 2) { if (w === 2 && !pl.weaponOwned) return; game.setWeapon(w); return }
    if (pl.werewolf) { game.setWeapon(w); return }
    pl.swapT = 1e-4; pl.swapTo = w; pl.swapStep = 0; pl.swapFrom = { x: armR.rotation.x, z: armR.rotation.z }; pl.swapAudioDone = false; game.playSfx('mudancaarma', .85);
}

export function finishSwap(game) {
    const { pl } = game;
    if (pl.swapT > 0 && pl.swapStep < 2) game.applyWeapon(pl.swapTo); pl.swapT = 0;
}

export function swapAnim(game, dt) {
    const { pl, sword, swordLeft, gun, reticle, swordHipBlade, gunHipButt, armR, armL, torso } = game;
    pl.swapT += dt; const t = pl.swapT, old = 1 - pl.swapTo;
    if (pl.swapStep < 1 && t >= SWAP.store) { pl.swapStep = 1; sword.visible = false; swordLeft.visible = false; gun.visible = false; reticle.visible = false; if (old === 0) swordHipBlade.visible = true; else gunHipButt.visible = true; }
    if (pl.swapStep < 2 && t >= SWAP.draw) { pl.swapStep = 2; game.applyWeapon(pl.swapTo); }
    const A = { x: -1.35, z: old ? -.65 : .72 }, B = { x: -1.55, z: pl.swapTo ? -.7 : .72 }, C = pl.swapTo ? { x: -1.12, z: -.08 } : { x: -1.0, z: -.18 }, F = pl.swapFrom; let a, b, k;
    if (t < SWAP.store) { a = F; b = A; k = t / SWAP.store } else if (t < SWAP.draw) { a = A; b = B; k = (t - SWAP.store) / (SWAP.draw - SWAP.store) } else { a = B; b = C; k = Math.min(1, (t - SWAP.draw) / (SWAP.dur - SWAP.draw)) }
    k = k * k * (3 - 2 * k); armR.rotation.x = a.x + (b.x - a.x) * k; armR.rotation.z = a.z + (b.z - a.z) * k; armL.rotation.x += (-1.25 - armL.rotation.x) * Math.min(1, 8 * dt);
    torso.rotation.y = Math.sin(Math.min(1, t / SWAP.dur) * PI) * .18 * (old ? 1 : -1);
    if (t >= SWAP.dur) { pl.swapT = 0; torso.rotation.y = 0; }
}

export function poseWeaponArms(game, dt) {
    const { pl, armL, armR, gun, sword, scythe } = game;
    if (pl.swapT > 0 || pl.state === 'attack' || pl.state === 'dodge' || pl.scytheAction?.type === 'spin') return; const k = Math.min(1, 16 * dt);
    if (pl.weapon === 1) {
        armL.position.x += (-.31 - armL.position.x) * k; armL.position.y += (.62 - armL.position.y) * k; armL.rotation.x += (-1.12 - armL.rotation.x) * k; armL.rotation.y += (.02 - armL.rotation.y) * k; armL.rotation.z += (.18 - armL.rotation.z) * k;
        armR.position.x += (.38 - armR.position.x) * k; armR.position.y += (.62 - armR.position.y) * k; armR.rotation.x += (-.98 - pl.rec * .12 - armR.rotation.x) * k; armR.rotation.y += (.02 - armR.rotation.y) * k; armR.rotation.z += (-.12 - armR.rotation.z) * k;
        gun.rotation.set(0, 0, 0);
    } else if (pl.weapon === 2) {
        armL.position.x += (-.34 - armL.position.x) * k; armR.position.x += (.34 - armR.position.x) * k;
        armL.rotation.x += (-1.0 - armL.rotation.x) * k; armR.rotation.x += (-1.0 - armR.rotation.x) * k;
        armL.rotation.z += (.18 - armL.rotation.z) * k; armR.rotation.z += (-.18 - armR.rotation.z) * k; scythe.rotation.set(0, 0, 0);
    } else {
        armL.position.x += (-.38 - armL.position.x) * k; armL.position.y += (.62 - armL.position.y) * k; armL.rotation.x += (-.2 - armL.rotation.x) * k; armL.rotation.y += (0 - armL.rotation.y) * k; armL.rotation.z += (.08 - armL.rotation.z) * k;
        armR.position.x += (.38 - armR.position.x) * k; armR.position.y += (.62 - armR.position.y) * k; armR.rotation.x += (-.2 - armR.rotation.x) * k; armR.rotation.y += (0 - armR.rotation.y) * k; armR.rotation.z += (-.08 - armR.rotation.z) * k;
        game.swordLeft.rotation.x += (-.9 - game.swordLeft.rotation.x) * k; game.swordLeft.rotation.y += (0 - game.swordLeft.rotation.y) * k; game.swordLeft.rotation.z += (0 - game.swordLeft.rotation.z) * k; sword.rotation.x += (-.9 - sword.rotation.x) * k; sword.rotation.y += (0 - sword.rotation.y) * k; sword.rotation.z += (0 - sword.rotation.z) * k;
    }
}

export function shoot(game) {
    const { pl, gun, scene, bullets, bgeo, spark, playSfx } = game;
    if (pl.swapT > 0 || pl.weapon !== 1) return; if (pl.ammo <= 0) { pl.buf = 0; toast('Sem balas! Procure o mercador.'); playSfx('merchant', .45); return } pl.ammo--; pl.shootCd = .5; pl.buf = 0; pl.rec = 1; gun.localToWorld(tmp.set(0, .035, 1.15)); const b = new THREE.Mesh(bgeo, new THREE.MeshBasicMaterial({ color: pl.skills.explosive ? 0xff9b35 : 0xffe08a })); b.position.copy(tmp); scene.add(b); bullets.push({ m: b, vx: Math.sin(pl.face) * 38, vz: Math.cos(pl.face) * 38, l: 1.1, explosive: !!pl.skills.explosive }); spark(tmp, 0xffc46a, 10, 5, .16, 3); spark(tmp, 0x888888, 6, 2, .3, -1); game.shake = .2; playSfx('trabuco'); setTimeout(() => playSfx('recharge', .8), 260)
}

export function lightningCut(game) {
    const { pl, scene, enemies, spark, playSfx, push } = game;
    const dirX = Math.sin(pl.face), dirZ = Math.cos(pl.face); const startX = pl.x, startZ = pl.z; const endX = startX + dirX * 7.5, endZ = startZ + dirZ * 7.5; const beam = new THREE.Mesh(new THREE.BoxGeometry(2.2, .18, 7.8), new THREE.MeshBasicMaterial({ color: 0x55dfff, transparent: true, opacity: .85 })); beam.position.set(startX + dirX * 3.8, 1.25, startZ + dirZ * 3.8); beam.rotation.y = pl.face; scene.add(beam); const glow = new THREE.PointLight(0x36cfff, 5, 13); glow.position.set(startX + dirX * 3.2, 1.8, startZ + dirZ * 3.2); scene.add(glow); let life = 0; const fx = () => { life += .045; beam.material.opacity = Math.max(0, .85 - life); beam.scale.x = 1 + life * 1.4; glow.intensity = Math.max(0, 5 - life * 8); if (life >= .8) { scene.remove(beam); scene.remove(glow) } else requestAnimationFrame(fx) }; requestAnimationFrame(fx); spark(tmp.set(startX, 1.2, startZ), 0x6de7ff, 28, 9, .18, 1); playSfx('danoeletrico'); game.shake = .55; pl.lightningDash = { sx: startX, sz: startZ, ex: endX, ez: endZ, t: 0, dur: .22 }; for (const e of enemies) { if (e.dead || e.clone) continue; const rx = e.x - startX, rz = e.z - startZ, along = rx * dirX + rz * dirZ, side = Math.abs(rx * dirZ - rz * dirX); if (along >= -.3 && along <= 8 && side <= 1.45) { game.hitEnemy(e, { dmg: 48, fix: 1, kb: 8, heavy: 1, hs: .09 }, dirX, dirZ); if (!e.dead) { e.stun = 4; e.state = 'chase'; e.cd = Math.max(e.cd, 4); e.paralyzed = 4 } } } push(pl, .45)
}

export function startAttack(game, i) {
    const { pl, playSfx } = game;
    if (pl.swapT > 0 || pl.weapon === 1) return; faceMouse(game);
    Object.assign(pl, { state: 'attack', i, atkT: 0, queued: false, buf: 0, combat: 1.8, lightningDone: false, attackFxDone: false }); if (pl.weapon === 2) pl.scytheMode = i === 2 ? 'hammer' : 'scythe'; pl.hit = new Set(); pl.sp = { ...pl.pose }; playSfx('sword', i === 2 ? 1.15 : 1);
    $('pips').children[i].classList.add('on'); if (i === 0) [...$('pips').children].forEach((u, j) => j && u.classList.remove('on'))
}

export function hurtPlayer(game, d, nx, nz) {
    const { pl, S, vis, playSfx, txt } = game;
    if (pl.god || S.god) { pl.hp = pl.max; pl.stamina = pl.staminaMax; return } if (pl.weapon === 2) d = Math.ceil(d * .8); if (pl.iframe > 0 || pl.state === 'dead' || (pl.scytheAction && pl.scytheAction.type === 'grapple')) return; pl.hp -= d; hpHit(); if (S.vib && navigator.vibrate) navigator.vibrate(60); pl.iframe = .6; pl.x += nx * .8; pl.z += nz * .8; game.shake = .5; $('flash').style.opacity = .9; setTimeout(() => $('flash').style.opacity = 0, 200); playSfx('somdor');
    txt(d, tmp.set(pl.x, pl.y + 2.4, pl.z), '#ff6a5a');
    if (pl.hp <= 0) { pl.hp = 0; pl.state = 'dead'; vis.rotation.x = -1.5; vis.position.y = .3; $('dlv').textContent = pl.lv; $('dco').textContent = pl.coins; setTimeout(() => $('dead').classList.remove('hide'), 900) }
}

export function updWeaponFx(game, dt) {
    const { pl, wfx, blade, sword, gun, spark } = game;
    const P = pl.skills.swordPath, st = P === 'fire' ? (pl.skills.fireStage || 0) : P === 'storm' ? (pl.skills.stormStage || 0) : 0, mx = st >= 5, t = pl.t;
    for (const k of ['sw', 'gn']) {
        const f = wfx[k]; f.fire.visible = mx && P === 'fire'; f.bolt.visible = mx && P === 'storm';
        if (f.fire.visible) f.F.forEach(o => { o.c.scale.set(.9 + .2 * Math.sin(t * 12 + o.i), .8 + .55 * Math.sin(t * 16 + o.i * 1.9 + o.c.position.x * 9), 1); o.c.material.opacity = .65 + .3 * Math.sin(t * 20 + o.i) });
        if (f.bolt.visible) { f.tb -= dt; if (f.tb <= 0) { f.tb = .05; f.B.forEach(b => { b.position.set(rnd(-.12, .12), rnd(f.y0, f.y1), rnd(-.06, .06)); b.rotation.z = rnd(-.9, .9); b.rotation.x = rnd(-.5, .5); b.scale.y = rnd(.5, 1.6); b.visible = Math.random() < .8 }) } }
    }
    if (pl.weapon === 0 && st > 0 && pl.state !== 'dead') {
        pl.footFxT = (pl.footFxT || 0) - dt;
        if (pl.footFxT <= 0) {
            pl.footFxT = .08;
            const col = P === 'fire' ? 0xff7624 : 0x6ce8ff;
            for (const side of [-1, 1]) spark(tmp.set(pl.x + Math.cos(pl.face) * side * .18, pl.y + .15, pl.z - Math.sin(pl.face) * side * .18), col, 2, 1.5, .12, P === 'fire' ? -1 : 0);
        }
    }
    if (!mx) return; blade.material.emissive.setHex(P === 'fire' ? 0xb02a0c : 0x1a7fa8); const col = P === 'fire' ? 0xff7a1a : 0x7fe9ff, gv = P === 'fire' ? -2 : 0;
    if (sword.visible && Math.random() < .4) { sword.localToWorld(tmp.set(0, -1.2 - Math.random() * .4, 0)); spark(tmp, col, 1, 2, .1, gv) }
    if (gun.visible && Math.random() < .4) { gun.localToWorld(tmp.set(0, .035, 1.15)); spark(tmp, col, 1, 2, .1, gv) }
}

export function scytheAction(game, type) {
    const { pl, enemies, spark, playSfx } = game;
    if (pl.weapon !== 2 || !pl.weaponOwned || pl.scytheCd > 0 || pl.para > 0 || pl.state === 'dead' || pl.state === 'attack' || pl.state === 'dodge' || pl.scytheAction) return false;
    if (type === 'grapple' || type === 'pull') {
        const hook = pl.scytheThrow, target = hook?.target;
        if (hook?.phase !== 'attached' || !target || target.dead || !enemies.includes(target)) { toast('Acerte um inimigo com a foice primeiro'); return false }
        const dx = target.x - pl.x, dz = target.z - pl.z, d = Math.hypot(dx, dz) || 1;
        pl.face = Math.atan2(dx, dz); pl.buf = 0; pl.scytheCd = 2.2;
        pl.scytheAction = { type, target, phase: 'travel', t: 0, dur: Math.max(.18, d / (type === 'grapple' ? 19 : 12)) };
        if (type === 'grapple') { pl.iframe = .15; playSfx('dash', 1.2); spark(tmp.set(pl.x, pl.y + 1, pl.z), 0xcbd1d5, 12, 5, .18, 1) }
        else { target.state = 'chase'; target.stun = Math.max(target.stun || 0, pl.scytheAction.dur); target.kx = 0; target.kz = 0; playSfx('sword', .9) }
        return true;
    }
    if (type === 'spin') {
        if (pl.scytheThrow) return false;
        pl.buf = 0; pl.scytheCd = 1.15;
        pl.scytheAction = { type, t: 0, dur: .65 }; pl.iframe = Math.max(pl.iframe, .65); playSfx('shield');
        for (const e of enemies) { if (e.dead || e.clone) continue; const ex = e.x - pl.x, ez = e.z - pl.z, ed = Math.hypot(ex, ez); if (ed < 2.8) { e.kx = ex / (ed || 1) * 9; e.kz = ez / (ed || 1) * 9; e.stun = Math.max(e.stun || 0, .45) } }
        for (const a of game.enemyArrows) { const ad = Math.hypot(a.m.position.x - pl.x, a.m.position.z - pl.z); if (ad < 2.8) { a.vx = Math.sin(pl.face) * 23; a.vz = Math.cos(pl.face) * 23; a.reflected = true; a.damage = 24; a.m.material.color.setHex(0xcbd1d5) } }
        spark(tmp.set(pl.x, 1.1, pl.z), 0xcbd1d5, 28, 8, .24, 1); game.shake = .35; return true;
    }
    return false;
}

export function clearScytheThrow(game) {
    const a = game.pl.scytheThrow;
    if (!a) return;
    game.scene.remove(a.projectile);
    game.scene.remove(a.rope);
    a.rope.geometry.dispose();
    a.rope.material.dispose();
    game.pl.scytheThrow = null;
    game.scythe.visible = game.pl.weapon === 2;
}

export function throwScythe(game) {
    const { pl, scythe, scene } = game;
    if (pl.scytheThrow) {
        if (pl.scytheAction) return false;
        pl.scytheThrow.phase = 'return';
        pl.scytheThrow.target = null;
        return true;
    }
    if (pl.weapon !== 2 || !pl.weaponOwned || pl.state === 'dead' || pl.state === 'attack' || pl.state === 'dodge' || pl.swapT > 0 || pl.scytheAction || pl.para > 0) return false;
    faceMouse(game);
    const projectile = scythe.clone(true);
    projectile.visible = true;
    projectile.scale.setScalar(.62);
    projectile.position.set(pl.x, pl.y + 1.2, pl.z);
    scene.add(projectile);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1, 6), new THREE.MeshStandardMaterial({ color: 0x8b6840 }));
    scene.add(rope);
    scythe.visible = false;
    pl.buf = 0;
    pl.scytheThrow = { projectile, rope, phase: 'out', dx: Math.sin(pl.face), dz: Math.cos(pl.face), distance: 0, t: 0, target: null };
    game.playSfx('sword', 1.1);
    return true;
}

function updateScytheThrow(game, dt) {
    const { pl, enemies, hgt } = game, a = pl.scytheThrow;
    if (!a) return;
    if (pl.state === 'dead' || pl.weapon !== 2) { clearScytheThrow(game); return }
    const p = a.projectile.position;
    a.t += dt;
    if (a.phase === 'out') {
        const step = Math.min(24 * dt, 14 - a.distance);
        let hit = null, first = Infinity;
        for (const e of enemies) {
            if (e.dead || e.clone) continue;
            const x = e.x - p.x, z = e.z - p.z, along = x * a.dx + z * a.dz;
            const radius = Math.max(.6, (e.T?.sc || 1) * .65);
            const sideSq = Math.max(0, x * x + z * z - along * along);
            if (sideSq > radius * radius) continue;
            const offset = Math.sqrt(radius * radius - sideSq);
            const entry = Math.max(0, along - offset);
            if (along + offset >= 0 && entry <= step && entry < first) { hit = e; first = entry }
        }
        const travel = hit ? first : step;
        p.x += a.dx * travel; p.z += a.dz * travel;
        p.y = hgt(p.x, p.z) + 1.2;
        a.distance += travel;
        a.projectile.rotation.z += dt * 18;
        if (hit) {
            a.phase = 'attached'; a.target = hit;
            a.offsetX = p.x - hit.x; a.offsetZ = p.z - hit.z;
            a.impactT = 0; a.impactRotation = a.projectile.rotation.z;
            game.spark(p, 0xdfe5e8, 12, 4, .15, 1);
        } else if (a.distance >= 14) a.phase = 'return';
    } else if (a.phase === 'attached') {
        if (!a.target || a.target.dead || !enemies.includes(a.target)) { a.phase = 'return'; a.target = null }
        else {
            p.set(a.target.x + a.offsetX, hgt(a.target.x, a.target.z) + 1.2, a.target.z + a.offsetZ);
            a.impactT += dt;
            a.projectile.rotation.z = a.impactRotation + Math.sin(a.impactT * 28) * .3 * Math.max(0, 1 - a.impactT / .3);
        }
    } else {
        const dx = pl.x - p.x, dy = pl.y + 1.2 - p.y, dz = pl.z - p.z, distance = Math.hypot(dx, dy, dz);
        if (distance <= 28 * dt || distance < .15) { clearScytheThrow(game); return }
        p.x += dx / distance * 28 * dt; p.y += dy / distance * 28 * dt; p.z += dz / distance * 28 * dt;
        a.projectile.rotation.z += dt * 18;
    }
    const start = new THREE.Vector3(pl.x, pl.y + 1.2, pl.z), direction = new THREE.Vector3().subVectors(p, start);
    const length = direction.length();
    a.rope.visible = length > .01;
    if (a.rope.visible) {
        a.rope.position.copy(start).addScaledVector(direction, .5);
        a.rope.scale.set(1, length, 1);
        a.rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    }
}

function updateScytheAction(game, dt) {
    const { pl, root, scythe, enemies, spark } = game, a = pl.scytheAction;
    pl.scytheCd = Math.max(0, (pl.scytheCd || 0) - dt);
    if (!a) return;
    a.t += dt;
    if (a.type === 'grapple' || a.type === 'pull') {
        const target = a.target;
        const hook = pl.scytheThrow;
        if (pl.state === 'dead' || !target || target.dead || !enemies.includes(target) || (a.phase === 'travel' && (hook?.phase !== 'attached' || hook.target !== target))) { pl.scytheAction = null; pl.iframe = 0; game.vis.position.y = 0; game.vis.rotation.x = pl.state === 'dead' ? -1.5 : 0; return }
        const dx = target.x - pl.x, dz = target.z - pl.z, distance = Math.hypot(dx, dz), nx = dx / (distance || 1), nz = dz / (distance || 1);
        pl.face = Math.atan2(dx, dz);
        if (a.phase === 'travel') {
            const step = Math.min(Math.max(0, distance - 1.2), (a.type === 'grapple' ? 19 : 12) * dt);
            if (a.type === 'grapple') { pl.x += nx * step; pl.z += nz * step; pl.iframe = .15 }
            else { target.x -= nx * step; target.z -= nz * step; target.kx = 0; target.kz = 0; target.stun = Math.max(target.stun || 0, .1); target.g.position.set(target.x, game.hgt(target.x, target.z), target.z) }
            if (distance - step <= 1.2 || a.t >= a.dur) {
                clearScytheThrow(game);
                a.phase = 'slam'; a.t = 0; a.hit = false;
                target.stun = Math.max(target.stun || 0, .8);
                playSlamWindup(game);
            }
        } else {
            target.stun = Math.max(target.stun || 0, .1);
            if (!a.hit && a.t >= .38) {
                a.hit = true;
                game.hitEnemy(target, { dmg: 150, fix: 1, ignoreArmor: 1, kb: 13, heavy: 1, hs: .21 }, nx, nz);
                game.shake = .8; spark(tmp.set(target.x, game.hgt(target.x, target.z) + .25, target.z), 0xffd35a, 32, 9, .28, 1); game.audio.hammerImpact(); game.playSfx('bomba', .75);
            }
            if (a.t >= .62) { pl.scytheAction = null; pl.iframe = 0; pl.scytheCd = .9; game.vis.position.y = 0; game.vis.rotation.x = 0 }
        }
    } else if (a.type === 'spin') {
        scythe.rotation.y = a.t * 18; scythe.rotation.z = Math.sin(a.t * 18) * .45;
        for (const arrow of game.enemyArrows) { const d = Math.hypot(arrow.m.position.x - pl.x, arrow.m.position.z - pl.z); if (d < 2.8 && !arrow.reflected) { arrow.vx = Math.sin(pl.face) * 23; arrow.vz = Math.cos(pl.face) * 23; arrow.reflected = true; arrow.damage = 24; arrow.m.material.color.setHex(0xcbd1d5) } }
        if (a.t >= a.dur) { scythe.rotation.set(0, 0, 0); pl.scytheAction = null; pl.iframe = 0 }
    } else if (a.t >= a.dur) { pl.scytheAction = null }
}

function playSlamWindup(game) { game.playSfx('sword', 1.1) }

export function updPlayer(game, dt) {
    const { pl, keys, want, S, vis, torso, armL, armR, sword, swordLeft, scythe, blade, legL, legR, wolfArms, wolfLegs, root, enemies, slashMat, slashGlow, slashFx, spark, playSfx, push, hgt } = game;
    updateScytheAction(game, dt); updateScytheThrow(game, dt); if (pl.scytheThrow) pl.buf = 0; const PZ = pl.para > 0 || !!pl.scytheAction; if (pl.para > 0) pl.para = Math.max(0, pl.para - dt); if (PZ) { pl.buf = 0; want.dodge = false } const ix = PZ ? 0 : (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), iz = PZ ? 0 : (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0); let mx = ix, mz = iz; const ml = Math.hypot(mx, mz); if (ml) { mx /= ml; mz /= ml }
    if (!PZ && pl.state !== 'dead' && pl.state !== 'dodge') faceMouse(game);
    pl.t += dt; pl.shootCd = Math.max(0, pl.shootCd - dt); pl.dcd = Math.max(0, pl.dcd - dt); pl.iframe = Math.max(0, pl.iframe - dt); pl.buf = Math.max(0, pl.buf - dt);
    if (want.dodge) { want.dodge = false; if (pl.state === 'dodge') { if (pl.st >= DODGE.duration - DODGE.bufferWindow) pl.dodgeQueued = true } else if (pl.stamina > 0 && pl.dcd <= 0 && pl.state !== 'dead' && (pl.state !== 'attack' || pl.atkT > ATK[pl.i].te)) { const fx = Math.sin(pl.face), fz = Math.cos(pl.face), rx = Math.cos(pl.face), rz = -Math.sin(pl.face); let dx = -fx, dz = -fz, rollBack = true, side = 0; if (keys.w || keys.arrowup) { dx = fx; dz = fz; rollBack = false } else if (keys.a || keys.arrowleft) { dx = -rx; dz = -rz; rollBack = false; side = -1 } else if (keys.d || keys.arrowright) { dx = rx; dz = rz; rollBack = false; side = 1 } else { dx = -fx; dz = -fz; rollBack = true } if (pl.swapT > 0) finishSwap(game); const canVault = pl.weapon === 0 && !pl.werewolf && !(keys.a || keys.d || keys.s || keys.arrowleft || keys.arrowright || keys.arrowdown); const target = canVault ? enemies.filter(e => !e.dead && !e.clone).map(e => { const x = e.x - pl.x, z = e.z - pl.z; return { e, along: x * fx + z * fz, side: Math.abs(x * fz - z * fx) } }).filter(e => e.along > .35 && e.along <= 4.5 && e.side <= 1.4).sort((a, b) => a.along - b.along)[0] : null; pl.stamina = Math.max(0, pl.stamina - DODGE.staminaCost); Object.assign(pl, { state: 'dodge', st: 0, dx: target ? fx : dx, dz: target ? fz : dz, rollSide: side, rollBack: target ? false : rollBack, iframe: target ? .55 : DODGE.iframes, dcd: DODGE.cooldown, dodgeQueued: false, swordVault: target ? { target: target.e, sx: pl.x, sz: pl.z, distance: target.along + 1.6, hit: false } : null }); spark(tmp.set(pl.x, pl.y + .2, pl.z), 0xd9b27c, 8, 3, .2); playSfx('dash') } }
    if (pl.god || S.god) { pl.hp = pl.max; pl.stamina = pl.staminaMax; pl.coins = 999999 } else if (pl.state !== 'dodge' && pl.state !== 'dead') pl.stamina = Math.min(pl.staminaMax, pl.stamina + DODGE.regenPerSecond * dt);
    let vx = 0, vz = 0, moving = false, attackDuration = 1;
    if (pl.state === 'idle' || pl.state === 'move') {
        if (pl.weapon === 1) {
            if (pl.buf > 0 && pl.shootCd <= 0) shoot(game);
            if (ml) { pl.state = 'move'; const pace = pl.weapon === 2 ? 4.2 : 5; vx = mx * pace; vz = mz * pace; moving = true } else pl.state = 'idle'
        }
        else if (pl.weapon === 2 && pl.buf > 0) { startAttack(game, pl.t - pl.lastEnd < .55 && pl.last >= 0 && pl.last < 2 ? pl.last + 1 : 0) }
        else if (pl.buf > 0) { startAttack(game, pl.t - pl.lastEnd < .35 && pl.last < 2 ? pl.last + 1 : 0) }
        else if (ml) { pl.state = 'move'; const pace = pl.weapon === 0 ? 9 : 6; vx = mx * pace; vz = mz * pace; moving = true } else pl.state = 'idle'
    }
    if (pl.state === 'attack') {
        const a = pl.weapon === 2 ? { ...ATK[pl.i], dur: pl.i === 2 ? .82 : .68, ts: pl.i === 2 ? .3 : .22, te: pl.i === 2 ? .55 : .42, dmg: pl.i === 2 ? 70 : 25, rng: pl.i === 2 ? 3.3 : 3.1, arc: pl.i === 2 ? 115 : 155, kb: pl.i === 2 ? 8 : 6, heavy: pl.i === 2 ? 1 : 0, lunge: pl.i === 2 ? .7 : 1.5 } : ATK[pl.i]; attackDuration = a.dur; pl.atkT += dt; blade.material.emissive.setHex(pl.skills.swordPath === 'fire' ? 0xb02a0c : 0x223344);
        if (pl.buf > 0 && pl.atkT > .08 && !pl.queued) { pl.queued = true; pl.buf = 0 }
        const sp = a.lunge * Math.max(0, 1 - pl.atkT / a.te);
        if (pl.weapon === 0 && ml) { vx = mx * 9; vz = mz * 9; moving = true }
        else { vx = Math.sin(pl.face) * sp; vz = Math.cos(pl.face) * sp }
        let p; if (pl.atkT < a.ts) p = lerpPose(pl.sp, a.from, Math.pow(pl.atkT / a.ts, 2)); else if (pl.atkT < a.te) { const k = (pl.atkT - a.ts) / (a.te - a.ts); p = lerpPose(a.from, a.to, 1 - Math.pow(1 - k, 3)) } else p = lerpPose(a.to, REST, (pl.atkT - a.te) / (a.dur - a.te));
        pl.pose = p; const phase = Math.min(1, pl.atkT / a.dur); vis.rotation.y = Math.sin(phase * PI) * (.16 + (pl.i === 2 ? .18 : 0)); torso.rotation.x = Math.sin(phase * PI) * -.16; torso.rotation.z = Math.sin(phase * PI * 2) * .12; vis.position.y = Math.sin(phase * PI) * .06; armL.rotation.x = -.45 - Math.sin(phase * PI) * .55; armL.rotation.z = .18 + Math.sin(phase * PI) * .3; if (pl.weapon === 2) { const swing = Math.sin(phase * PI), direction = pl.i === 1 ? -1 : 1; if (pl.i === 2) { const wind = Math.min(1, pl.atkT / a.ts), strike = Math.min(1, Math.max(0, (pl.atkT - a.ts * .55) / (a.ts * .45))); const recover = Math.min(1, Math.max(0, (pl.atkT - a.te) / (a.dur - a.te))); scythe.rotation.set(-1.6 * wind + 2.5 * strike - .9 * recover, 0, 0); scythe.position.set(0, .12 + 1.25 * wind - 2.2 * strike + .95 * recover, .48 - .1 * wind + 1.1 * strike - 1.0 * recover); armL.rotation.x = armR.rotation.x = -1 - 1.5 * wind + 2.3 * strike - .8 * recover; armL.rotation.z = .15; armR.rotation.z = -.15; torso.rotation.x = -.35 * wind + .8 * strike - .45 * recover; torso.rotation.y = 0; } else { scythe.rotation.y = direction * (phase < .5 ? -1 + phase * 4 : 3 - phase * 4) * .9; scythe.rotation.z = direction * .7 * swing; scythe.rotation.x = -.25 * swing; armL.rotation.x = armR.rotation.x = -1 - swing * .35; armL.rotation.z = .18 + direction * swing * .45; armR.rotation.z = -.18 + direction * swing * .45; torso.rotation.y = direction * swing * .5; } } else { sword.rotation.x = -2.48 + Math.sin(phase * PI) * -.55; sword.rotation.z = (pl.i === 1 ? -.25 : pl.i === 2 ? .35 : .12) + Math.sin(phase * PI * 2) * .28; } if (pl.weapon === 0 && pl.i === 2 && pl.skills.lightning && !pl.lightningDone && pl.atkT >= a.ts) { pl.lightningDone = true; lightningCut(game) } if (pl.lightningDash) { const d = pl.lightningDash; d.t += dt; const q = Math.min(1, d.t / d.dur), ease = q * q * (3 - 2 * q); pl.x = d.sx + (d.ex - d.sx) * ease; pl.z = d.sz + (d.ez - d.sz) * ease; vx = 0; vz = 0; if (q >= 1) pl.lightningDash = null }
        // Processa o impacto e os efeitos apenas uma vez por golpe, evitando
        // recriar partículas e percorrer todos os inimigos em cada frame da janela.
        if (!pl.attackFxDone && pl.atkT >= a.ts) {
            pl.attackFxDone = true;
            if (!(pl.weapon === 2 && pl.i === 2) && game.slashT <= 0) {
                game.slashT = .32;
                slashMat.color.setHex(pl.skills.swordPath === 'fire' ? 0xff2a1a : pl.werewolf ? 0xff563d : pl.i === 2 && pl.skills.lightning ? 0x66e8ff : a.heavy ? 0xffd36b : 0xfff0bd);
                slashGlow.material.color.setHex(pl.skills.swordPath === 'fire' ? 0xff5a12 : pl.i === 2 && pl.skills.lightning ? 0x168fff : a.heavy ? 0xff7a28 : 0xffb64d);
            }
            if (pl.weapon === 2 && pl.i === 2) { game.shake = .65; game.audio.hammerImpact(); game.playSfx('bomba', .6); spark(tmp.set(pl.x + Math.sin(pl.face) * 1.5, pl.y + .15, pl.z + Math.cos(pl.face) * 1.5), 0xffd35a, 28, 7, .2, 1); }
            const attackWeapon = pl.weapon === 2 ? scythe : sword;
            attackWeapon.localToWorld(tmp.set(0, -1.0, 0));
            spark(tmp, pl.skills.swordPath === 'fire' ? 0xff4a1a : (a.heavy ? 0xffe08a : 0xfff2c8), 2, 2, .12, 2);
        }
        if (pl.atkT >= a.ts && pl.atkT <= a.te) for (const e of enemies) {
            if (e.dead || pl.hit.has(e)) continue;
            const dx = e.x - pl.x, dz = e.z - pl.z, d = Math.hypot(dx, dz);
            if (pl.weapon === 0) {
                const along = dx * Math.sin(pl.face) + dz * Math.cos(pl.face);
                const side = dx * Math.cos(pl.face) - dz * Math.sin(pl.face);
                if (Math.abs(along) > 1.5 || Math.abs(side) > a.rng) continue;
            } else {
                if (d > a.rng + .5) continue;
                if (d > 1 && Math.abs(angDiff(Math.atan2(dx, dz), pl.face)) > a.arc / 2 * PI / 180) continue;
            }
            pl.hit.add(e); game.hitEnemy(e, a, dx / (d || 1), dz / (d || 1));
        }
        if (pl.atkT >= a.dur) { if (pl.werewolf) { wolfArms.forEach(a => a.rotation.set(0, 0, 0)); wolfLegs.forEach(l => l.rotation.set(0, 0, 0)); } vis.rotation.y = 0; vis.position.y = 0; torso.rotation.x = 0; torso.rotation.z = 0; sword.rotation.set(0, 0, 0); swordLeft.rotation.set(0, 0, 0); scythe.rotation.set(0, 0, 0); scythe.position.set(0, .12, .48); pl.last = pl.i; pl.lastEnd = pl.t; pl.combat = 1.8; if (pl.queued && pl.i < 2) startAttack(game, pl.i + 1); else { pl.state = 'idle'; pl.pose = { ...GUARD } } }
    }
    else if (pl.state !== 'dodge') { vis.rotation.y += (0 - vis.rotation.y) * Math.min(1, 12 * dt); vis.position.y += (0 - vis.position.y) * Math.min(1, 12 * dt); torso.rotation.x += (0 - torso.rotation.x) * Math.min(1, 12 * dt); torso.rotation.z += (0 - torso.rotation.z) * Math.min(1, 12 * dt); pl.combat = Math.max(0, pl.combat - dt); const ready = (!pl.weapon && pl.combat > 0) ? GUARD : REST; pl.pose = lerpPose(pl.pose, pl.weapon ? { x: -.72 - pl.rec * .25, y: 0, z: 0, t: 0 } : ready, Math.min(1, 12 * dt)); pl.rec = Math.max(0, pl.rec - dt * 5) }
    if (pl.state === 'dodge' && pl.swordVault) {
        const v = pl.swordVault; pl.st += dt; const k = Math.min(1, pl.st / .55);
        vx = pl.dx * v.distance / .55; vz = pl.dz * v.distance / .55;
        vis.position.y = Math.sin(k * PI) * 2.2; vis.rotation.x = -.3 * Math.sin(k * PI); torso.rotation.y = Math.sin(k * PI) * .5;
        if (!v.hit && k >= Math.max(.25, Math.min(.8, (v.distance - 1.6) / v.distance))) {
            v.hit = true; if (!v.target.dead && enemies.includes(v.target) && Math.hypot(v.target.x - pl.x, v.target.z - pl.z) < 1.8) {
                game.hitEnemy(v.target, { dmg: 30, fix: 1, kb: 2, heavy: 0, hs: Math.random() < .5 ? .09 : 0 }, pl.dx, pl.dz);
                spark(tmp.set(v.target.x, hgt(v.target.x, v.target.z) + 1.6 * (v.target.T?.sc || 1), v.target.z), 0xffe6c0, 14, 5, .15); playSfx('sword', 1.2);
            }
        }
        if (k >= 1) { pl.state = 'idle'; pl.iframe = 0; pl.swordVault = null; vis.position.set(0, 0, 0); vis.rotation.set(0, 0, 0); torso.rotation.set(0, 0, 0); legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0); pl.pose = { ...GUARD }; pl.combat = .8; }
    } else if (pl.state === 'dodge') { pl.st += dt; const D = DODGE.duration, k = Math.min(1, pl.st / D); const travel = (pl.werewolf ? (pl.rollBack ? 4.2 : 6.2) : DODGE.distance) / D; vx = pl.dx * travel; vz = pl.dz * travel; const tuck = Math.sin(Math.min(1, k * 1.35) * PI); if (pl.rollBack) { vis.rotation.x = -.08 - .16 * tuck; vis.position.y = .08 + tuck * .07; } else { { const th = PI * 2 * k, pe = 1.05, lift = .04 + .3 * Math.sin(k * PI); vis.scale.set(1, .90, 1); vis.position.y = pe - pe * Math.cos(th) + lift; if (pl.rollSide) { vis.rotation.x = 0; vis.rotation.z = -pl.rollSide * th; vis.position.x = -pl.rollSide * pe * Math.sin(th); vis.position.z = 0 } else { vis.rotation.x = th; vis.rotation.z = 0; vis.position.z = -pe * Math.sin(th); vis.position.x = 0 } } } if (pl.rollBack) vis.rotation.z = 0; if (!pl.rollBack) { if (pl.rollSide) { torso.rotation.x = .5; legL.rotation.x = -.95; legR.rotation.x = -.95 } else { torso.rotation.x = .62; legL.rotation.x = -.72; legR.rotation.x = .72 } } else { torso.rotation.x = -.12 - .12 * tuck; legL.rotation.x = -.55 * tuck; legR.rotation.x = .38 * tuck; } if (pl.st >= D) { pl.state = 'idle'; pl.iframe = 0; vis.position.set(0, 0, 0); vis.rotation.set(0, 0, 0); vis.scale.set(1, 1, 1); vis.position.set(0, 0, 0); torso.rotation.set(0, 0, 0); legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0); pl.pose = { ...GUARD }; pl.combat = .8; const queued = pl.dodgeQueued; pl.dodgeQueued = false; if (queued && pl.stamina > 0) { want.dodge = true; pl.dcd = 0 } } }
    if (pl.weapon === 2 && pl.state !== 'dodge' && !pl.scytheAction) { vx *= .78; vz *= .78 } pl.x += vx * dt; pl.z += vz * dt; push(pl, .45); pl.y = hgt(pl.x, pl.z);
    pl.walk += dt * (moving ? 11 : 0); const sw = moving ? .8 : 0; if (pl.state === 'attack') { const phase = Math.min(1, pl.atkT / attackDuration), q = Math.sin(phase * PI), wind = Math.sin(Math.min(1, phase * 2) * PI / 2), follow = Math.sin(Math.max(0, (phase - .42) / .58) * PI); if (pl.weapon === 0 && !pl.werewolf) { const side = pl.i === 1 ? -1 : 1, sweep = Math.sin(phase * PI * 2); armR.rotation.x = -1.15 - q * .25; armR.rotation.z = -.3 + side * sweep * .9; armL.rotation.x = -.75 + q * .3; armL.rotation.z = .25 - side * q * .35; torso.rotation.y = side * sweep * .65; torso.rotation.x = -.1; sword.rotation.x = -2.3; sword.rotation.y = side * sweep * 1.1; sword.rotation.z = side * sweep * .7; swordLeft.rotation.set(-2.3, -side * sweep * 1.1, -side * sweep * .7); armL.rotation.z = .3 - side * sweep * .9; } if (pl.werewolf) { wolfArms[0].rotation.x = -q * 1.35; wolfArms[1].rotation.x = -q * 1.35; wolfArms[0].rotation.z = q * .65; wolfArms[1].rotation.z = -q * .65; wolfLegs[0].rotation.x = -q * .45; wolfLegs[1].rotation.x = q * .45; } legL.rotation.x = -.35 - q * .8; legR.rotation.x = .25 + q * .65; legL.rotation.z = -.08; legR.rotation.z = .08 } else { legL.rotation.x = Math.sin(pl.walk) * sw; legR.rotation.x = -Math.sin(pl.walk) * sw; legL.rotation.z = 0; legR.rotation.z = 0 } if (pl.state !== 'attack' && pl.weapon !== 0) armL.rotation.x = -Math.sin(pl.walk) * sw * .8; if (pl.werewolf) { wolfLegs[0].rotation.x = Math.sin(pl.walk) * sw; wolfLegs[1].rotation.x = -Math.sin(pl.walk) * sw; wolfLegs[2].rotation.x = -Math.sin(pl.walk) * sw; wolfLegs[3].rotation.x = Math.sin(pl.walk) * sw; wolfArms[0].rotation.x = -Math.sin(pl.walk) * sw * .7; wolfArms[1].rotation.x = Math.sin(pl.walk) * sw * .7; }
    if (pl.state === 'attack' && pl.weapon === 0 && moving) { legL.rotation.x = Math.sin(pl.walk) * .8; legR.rotation.x = -Math.sin(pl.walk) * .8; torso.rotation.x = -.2 }
    if (pl.state !== 'attack' || pl.werewolf) { if (pl.weapon !== 0 || pl.state === 'dodge' || pl.werewolf) armR.rotation.set(pl.pose.x, pl.pose.y, pl.pose.z); torso.rotation.y = pl.pose.t; }
    if (!(pl.state === 'attack' && pl.weapon === 2 && pl.i === 2)) scythe.position.set(0, .12, .48);
    poseWeaponArms(game, dt);
    if (pl.swordVault && pl.state === 'dodge') { const k = Math.min(1, pl.st / .55), q = Math.sin(k * PI); armR.rotation.set(-1.3, 0, -.5 + q * 1.4); sword.rotation.set(-2.2, q * 1.4, q * .8); swordLeft.rotation.set(-2.2, -q * 1.4, -q * .8); armL.rotation.x = -.6; legL.rotation.x = -q; legR.rotation.x = q; }
    if (pl.scytheAction?.phase === 'slam') { const k = Math.min(1, pl.scytheAction.t / .62), q = Math.sin(k * PI); vis.position.y = k < .62 ? Math.sin(k / .62 * PI) * 3 : 0; vis.rotation.x = k < .62 ? 2 * PI * k / .62 : 0; torso.rotation.x = k < .62 ? -.25 : .5 * (1 - k); armL.rotation.x = armR.rotation.x = k < .62 ? -1.2 - q * 1.3 : -.7; scythe.rotation.x = k < .62 ? -1.4 * q : .8 * (1 - k); scythe.rotation.z = .35 * q; }
    if (pl.scytheThrow && pl.scytheThrow.t < .35 && pl.scytheThrow.phase === 'out') { const swing = Math.sin(pl.scytheThrow.t / .35 * PI); armR.rotation.x -= swing * 1.3; armR.rotation.z -= swing * .5; torso.rotation.y = -swing * .35; } if (pl.swapT > 0) swapAnim(game, dt);
    if (game.slashT > 0) { game.slashT = Math.max(0, game.slashT - dt); const f = game.slashT / .32; slashFx.visible = true; slashMat.opacity = .95 * f; slashGlow.material.opacity = .5 * f; slashFx.scale.set(1.05 + (1 - f) * .55, .9 + (1 - f) * .25, 1); slashFx.rotation.z = (pl.i === 1 ? -.8 : pl.i === 2 ? .85 : .2) + (1 - f) * .6; } else slashFx.visible = false;
    root.position.set(pl.x, pl.y, pl.z); root.rotation.y = pl.face; game.setWolfForm(false);
}
