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
    return { x: 0, z: 2, y: 0, face: 0, hp: 100, max: 100, lv: 1, xp: 0, coins: 0, state: 'idle', t: 0, i: 0, atkT: 0, queued: false, last: -1, lastEnd: -9, buf: 0, dcd: 0, iframe: 0, st: 0, stamina: 100, staminaMax: 100, dx: 0, dz: 0, hit: new Set(), pose: { ...REST }, sp: { ...REST }, walk: 0, weapon: 0, ammo: 30, shootCd: 0, rec: 0, combat: 0, rollSide: 1, skills: { explosive: false, lightning: false, swordPath: null, fireStage: 0, stormStage: 0, sheath: false, repel: false, points: 0 }, para: 0, potions: 0, werewolf: false, god: !!S.god, magnetLevel: 0 };
}

export function clearInputs(game) { for (const k in game.keys) delete game.keys[k]; game.want.dodge = false; game.pl.buf = 0 }

export function aimPoint(game) { ray.setFromCamera(game.mouse, game.cam); plane.constant = -game.pl.y; const v = new THREE.Vector3(); return ray.ray.intersectPlane(plane, v) }

export function startSwap(game, w) {
    const { pl, armR } = game;
    if (pl.swapT > 0 || w === pl.weapon || pl.state === 'attack' || pl.state === 'dodge') return;
    if (pl.werewolf) { game.setWeapon(w); return }
    pl.swapT = 1e-4; pl.swapTo = w; pl.swapStep = 0; pl.swapFrom = { x: armR.rotation.x, z: armR.rotation.z }; pl.swapAudioDone = false; game.playSfx('mudancaarma', .85);
}

export function finishSwap(game) {
    const { pl } = game;
    if (pl.swapT > 0 && pl.swapStep < 2) game.applyWeapon(pl.swapTo); pl.swapT = 0;
}

export function swapAnim(game, dt) {
    const { pl, sword, gun, reticle, swordHipBlade, gunHipButt, armR, armL, torso } = game;
    pl.swapT += dt; const t = pl.swapT, old = 1 - pl.swapTo;
    if (pl.swapStep < 1 && t >= SWAP.store) { pl.swapStep = 1; sword.visible = false; gun.visible = false; reticle.visible = false; if (old === 0) swordHipBlade.visible = true; else gunHipButt.visible = true; }
    if (pl.swapStep < 2 && t >= SWAP.draw) { pl.swapStep = 2; game.applyWeapon(pl.swapTo); }
    const A = { x: -1.35, z: old ? -.65 : .72 }, B = { x: -1.55, z: pl.swapTo ? -.7 : .72 }, C = pl.swapTo ? { x: -1.12, z: -.08 } : { x: -1.0, z: -.18 }, F = pl.swapFrom; let a, b, k;
    if (t < SWAP.store) { a = F; b = A; k = t / SWAP.store } else if (t < SWAP.draw) { a = A; b = B; k = (t - SWAP.store) / (SWAP.draw - SWAP.store) } else { a = B; b = C; k = Math.min(1, (t - SWAP.draw) / (SWAP.dur - SWAP.draw)) }
    k = k * k * (3 - 2 * k); armR.rotation.x = a.x + (b.x - a.x) * k; armR.rotation.z = a.z + (b.z - a.z) * k; armL.rotation.x += (-1.25 - armL.rotation.x) * Math.min(1, 8 * dt);
    torso.rotation.y = Math.sin(Math.min(1, t / SWAP.dur) * PI) * .18 * (old ? 1 : -1);
    if (t >= SWAP.dur) { pl.swapT = 0; torso.rotation.y = 0; }
}

export function poseWeaponArms(game, dt) {
    const { pl, armL, armR, gun, sword } = game;
    if (pl.swapT > 0 || pl.state === 'attack' || pl.state === 'dodge') return; const k = Math.min(1, 16 * dt);
    if (pl.weapon) {
        armL.position.x += (-.31 - armL.position.x) * k; armL.position.y += (.62 - armL.position.y) * k; armL.rotation.x += (-1.12 - armL.rotation.x) * k; armL.rotation.y += (.02 - armL.rotation.y) * k; armL.rotation.z += (.18 - armL.rotation.z) * k;
        armR.position.x += (.38 - armR.position.x) * k; armR.position.y += (.62 - armR.position.y) * k; armR.rotation.x += (-.98 - pl.rec * .12 - armR.rotation.x) * k; armR.rotation.y += (.02 - armR.rotation.y) * k; armR.rotation.z += (-.12 - armR.rotation.z) * k;
        gun.rotation.set(0, 0, 0);
    } else {
        armL.position.x += (-.29 - armL.position.x) * k; armL.position.y += (.62 - armL.position.y) * k; armL.rotation.x += (-1.08 - armL.rotation.x) * k; armL.rotation.y += (.02 - armL.rotation.y) * k; armL.rotation.z += (.30 - armL.rotation.z) * k;
        armR.position.x += (.29 - armR.position.x) * k; armR.position.y += (.62 - armR.position.y) * k; armR.rotation.x += (-1.08 - armR.rotation.x) * k; armR.rotation.y += (-.02 - armR.rotation.y) * k; armR.rotation.z += (-.30 - armR.rotation.z) * k;
        sword.rotation.x += (-2.48 - sword.rotation.x) * k; sword.rotation.y += (0 - sword.rotation.y) * k; sword.rotation.z += (0 - sword.rotation.z) * k;
    }
}

export function shoot(game) {
    const { pl, gun, scene, bullets, bgeo, spark, playSfx } = game;
    if (pl.swapT > 0) return; if (pl.ammo <= 0) { pl.buf = 0; toast('Sem balas! Procure o mercador.'); playSfx('merchant', .45); return } pl.ammo--; pl.shootCd = .5; pl.buf = 0; pl.rec = 1; gun.localToWorld(tmp.set(0, .035, 1.15)); const b = new THREE.Mesh(bgeo, new THREE.MeshBasicMaterial({ color: pl.skills.explosive ? 0xff9b35 : 0xffe08a })); b.position.copy(tmp); scene.add(b); bullets.push({ m: b, vx: Math.sin(pl.face) * 38, vz: Math.cos(pl.face) * 38, l: 1.1, explosive: !!pl.skills.explosive }); spark(tmp, 0xffc46a, 10, 5, .16, 3); spark(tmp, 0x888888, 6, 2, .3, -1); game.shake = .2; playSfx('trabuco'); setTimeout(() => playSfx('recharge', .8), 260)
}

export function lightningCut(game) {
    const { pl, scene, enemies, spark, playSfx, push } = game;
    const dirX = Math.sin(pl.face), dirZ = Math.cos(pl.face); const startX = pl.x, startZ = pl.z; const endX = startX + dirX * 7.5, endZ = startZ + dirZ * 7.5; const beam = new THREE.Mesh(new THREE.BoxGeometry(2.2, .18, 7.8), new THREE.MeshBasicMaterial({ color: 0x55dfff, transparent: true, opacity: .85 })); beam.position.set(startX + dirX * 3.8, 1.25, startZ + dirZ * 3.8); beam.rotation.y = pl.face; scene.add(beam); const glow = new THREE.PointLight(0x36cfff, 5, 13); glow.position.set(startX + dirX * 3.2, 1.8, startZ + dirZ * 3.2); scene.add(glow); let life = 0; const fx = () => { life += .045; beam.material.opacity = Math.max(0, .85 - life); beam.scale.x = 1 + life * 1.4; glow.intensity = Math.max(0, 5 - life * 8); if (life >= .8) { scene.remove(beam); scene.remove(glow) } else requestAnimationFrame(fx) }; requestAnimationFrame(fx); spark(tmp.set(startX, 1.2, startZ), 0x6de7ff, 28, 9, .18, 1); playSfx('danoeletrico'); game.shake = .55; pl.lightningDash = { sx: startX, sz: startZ, ex: endX, ez: endZ, t: 0, dur: .22 }; for (const e of enemies) { if (e.dead || e.clone) continue; const rx = e.x - startX, rz = e.z - startZ, along = rx * dirX + rz * dirZ, side = Math.abs(rx * dirZ - rz * dirX); if (along >= -.3 && along <= 8 && side <= 1.45) { game.hitEnemy(e, { dmg: 48, fix: 1, kb: 8, heavy: 1, hs: .09 }, dirX, dirZ); if (!e.dead) { e.stun = 4; e.state = 'chase'; e.cd = Math.max(e.cd, 4); e.paralyzed = 4 } } } push(pl, .45)
}

export function startAttack(game, i) {
    const { pl, playSfx } = game;
    if (pl.swapT > 0) return; const a = aimPoint(game); if (a) { const dx = a.x - pl.x, dz = a.z - pl.z; if (Math.hypot(dx, dz) > .3) pl.face = Math.atan2(dx, dz) }
    Object.assign(pl, { state: 'attack', i, atkT: 0, queued: false, buf: 0, combat: 1.8, lightningDone: false }); pl.hit = new Set(); pl.sp = { ...pl.pose }; playSfx('sword', i === 2 ? 1.15 : 1);
    $('pips').children[i].classList.add('on'); if (i === 0) [...$('pips').children].forEach((u, j) => j && u.classList.remove('on'))
}

export function hurtPlayer(game, d, nx, nz) {
    const { pl, S, vis, playSfx, txt } = game;
    if (pl.god || S.god) { pl.hp = pl.max; pl.stamina = pl.staminaMax; return } if (pl.iframe > 0 || pl.state === 'dead') return; pl.hp -= d; hpHit(); if (S.vib && navigator.vibrate) navigator.vibrate(60); pl.iframe = .6; pl.x += nx * .8; pl.z += nz * .8; game.shake = .5; $('flash').style.opacity = .9; setTimeout(() => $('flash').style.opacity = 0, 200); playSfx('somdor');
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
    if (!mx) return; blade.material.emissive.setHex(P === 'fire' ? 0xb02a0c : 0x1a7fa8); const col = P === 'fire' ? 0xff7a1a : 0x7fe9ff, gv = P === 'fire' ? -2 : 0;
    if (sword.visible && Math.random() < .4) { sword.localToWorld(tmp.set(0, -1.2 - Math.random() * .4, 0)); spark(tmp, col, 1, 2, .1, gv) }
    if (gun.visible && Math.random() < .4) { gun.localToWorld(tmp.set(0, .035, 1.15)); spark(tmp, col, 1, 2, .1, gv) }
}

export function updPlayer(game, dt) {
    const { pl, keys, want, S, vis, torso, armL, armR, sword, blade, legL, legR, wolfArms, wolfLegs, root, enemies, slashMat, slashGlow, slashFx, spark, playSfx, push, hgt } = game;
    const PZ = pl.para > 0; if (PZ) { pl.para -= dt; pl.buf = 0; want.dodge = false } const ix = PZ ? 0 : (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), iz = PZ ? 0 : (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0); let mx = ix, mz = iz; const ml = Math.hypot(mx, mz); if (ml) { mx /= ml; mz /= ml }
    pl.t += dt; pl.shootCd = Math.max(0, pl.shootCd - dt); pl.dcd = Math.max(0, pl.dcd - dt); pl.iframe = Math.max(0, pl.iframe - dt); pl.buf = Math.max(0, pl.buf - dt);
    if (want.dodge) { want.dodge = false; if (pl.state === 'dodge') { if (pl.st >= DODGE.duration - DODGE.bufferWindow) pl.dodgeQueued = true } else if (pl.stamina > 0 && pl.dcd <= 0 && pl.state !== 'dead' && (pl.state !== 'attack' || pl.atkT > ATK[pl.i].te)) { const fx = Math.sin(pl.face), fz = Math.cos(pl.face), rx = Math.cos(pl.face), rz = -Math.sin(pl.face); let dx = -fx, dz = -fz, rollBack = true, side = 0; if (keys.w || keys.arrowup) { dx = fx; dz = fz; rollBack = false } else if (keys.a || keys.arrowleft) { dx = -rx; dz = -rz; rollBack = false; side = -1 } else if (keys.d || keys.arrowright) { dx = rx; dz = rz; rollBack = false; side = 1 } else { dx = -fx; dz = -fz; rollBack = true } if (pl.swapT > 0) finishSwap(game); pl.stamina -= DODGE.staminaCost; Object.assign(pl, { state: 'dodge', st: 0, dx, dz, rollSide: side, rollBack, iframe: DODGE.iframes, dcd: DODGE.cooldown, dodgeQueued: false }); spark(tmp.set(pl.x, pl.y + .2, pl.z), 0xd9b27c, 8, 3, .2); playSfx('dash') } }
    if (pl.god || S.god) { pl.hp = pl.max; pl.stamina = pl.staminaMax; pl.coins = 999999 } else if (pl.state !== 'dodge' && pl.state !== 'dead') pl.stamina = Math.min(pl.staminaMax, pl.stamina + DODGE.regenPerSecond * dt);
    let vx = 0, vz = 0, moving = false;
    if (pl.state === 'idle' || pl.state === 'move') {
        if (pl.weapon) {
            const a = aimPoint(game); if (a) { const dx = a.x - pl.x, dz = a.z - pl.z; if (Math.hypot(dx, dz) > .3) pl.face += angDiff(Math.atan2(dx, dz), pl.face) * Math.min(1, 20 * S.aim * dt) }
            if (pl.buf > 0 && pl.shootCd <= 0) shoot(game);
            if (ml) { pl.state = 'move'; vx = mx * 5; vz = mz * 5; moving = true } else pl.state = 'idle'
        }
        else if (pl.buf > 0) { startAttack(game, pl.t - pl.lastEnd < .35 && pl.last < 2 ? pl.last + 1 : 0) }
        else if (ml) { pl.state = 'move'; vx = mx * 6; vz = mz * 6; moving = true; pl.face += angDiff(Math.atan2(mx, mz), pl.face) * Math.min(1, 14 * dt) } else pl.state = 'idle'
    }
    if (pl.state === 'attack') {
        const a = ATK[pl.i]; pl.atkT += dt; blade.material.emissive.setHex(pl.skills.swordPath === 'fire' ? 0xb02a0c : 0x223344);
        if (pl.buf > 0 && pl.atkT > .08 && !pl.queued) { pl.queued = true; pl.buf = 0 }
        const sp = a.lunge * Math.max(0, 1 - pl.atkT / a.te); vx = Math.sin(pl.face) * sp; vz = Math.cos(pl.face) * sp;
        let p; if (pl.atkT < a.ts) p = lerpPose(pl.sp, a.from, Math.pow(pl.atkT / a.ts, 2)); else if (pl.atkT < a.te) { const k = (pl.atkT - a.ts) / (a.te - a.ts); p = lerpPose(a.from, a.to, 1 - Math.pow(1 - k, 3)) } else p = lerpPose(a.to, REST, (pl.atkT - a.te) / (a.dur - a.te));
        pl.pose = p; const phase = Math.min(1, pl.atkT / a.dur); vis.rotation.y = Math.sin(phase * PI) * (.16 + (pl.i === 2 ? .18 : 0)); torso.rotation.x = Math.sin(phase * PI) * -.16; torso.rotation.z = Math.sin(phase * PI * 2) * .12; vis.position.y = Math.sin(phase * PI) * .06; armL.rotation.x = -.45 - Math.sin(phase * PI) * .55; armL.rotation.z = .18 + Math.sin(phase * PI) * .3; sword.rotation.x = -2.48 + Math.sin(phase * PI) * -.55; sword.rotation.z = (pl.i === 1 ? -.25 : pl.i === 2 ? .35 : .12) + Math.sin(phase * PI * 2) * .28; if (pl.i === 2 && pl.skills.lightning && !pl.lightningDone && pl.atkT >= a.ts) { pl.lightningDone = true; lightningCut(game) } if (pl.lightningDash) { const d = pl.lightningDash; d.t += dt; const q = Math.min(1, d.t / d.dur), ease = q * q * (3 - 2 * q); pl.x = d.sx + (d.ex - d.sx) * ease; pl.z = d.sz + (d.ez - d.sz) * ease; vx = 0; vz = 0; if (q >= 1) pl.lightningDash = null }
        if (pl.atkT >= a.ts && pl.atkT <= a.te) {
            if (game.slashT <= 0) { game.slashT = .32; slashMat.color.setHex(pl.skills.swordPath === 'fire' ? 0xff2a1a : pl.werewolf ? 0xff563d : pl.i === 2 && pl.skills.lightning ? 0x66e8ff : a.heavy ? 0xffd36b : 0xfff0bd); slashGlow.material.color.setHex(pl.skills.swordPath === 'fire' ? 0xff5a12 : pl.i === 2 && pl.skills.lightning ? 0x168fff : a.heavy ? 0xff7a28 : 0xffb64d) } sword.localToWorld(tmp.set(0, -1.6, 0)); spark(tmp, pl.skills.swordPath === 'fire' ? 0xff4a1a : (a.heavy ? 0xffe08a : 0xfff2c8), 2, 2, .12, 2);
            for (const e of enemies) { if (e.dead || pl.hit.has(e)) continue; const dx = e.x - pl.x, dz = e.z - pl.z, d = Math.hypot(dx, dz); if (d > a.rng + .5) continue; if (d > 1 && Math.abs(angDiff(Math.atan2(dx, dz), pl.face)) > a.arc / 2 * PI / 180) continue; pl.hit.add(e); game.hitEnemy(e, a, dx / (d || 1), dz / (d || 1)) }
        }
        if (pl.atkT >= a.dur) { if (pl.werewolf) { wolfArms.forEach(a => a.rotation.set(0, 0, 0)); wolfLegs.forEach(l => l.rotation.set(0, 0, 0)); } vis.rotation.y = 0; vis.position.y = 0; torso.rotation.x = 0; torso.rotation.z = 0; sword.rotation.set(0, 0, 0); pl.last = pl.i; pl.lastEnd = pl.t; pl.combat = 1.8; if (pl.queued && pl.i < 2) startAttack(game, pl.i + 1); else { pl.state = 'idle'; pl.pose = { ...GUARD } } }
    }
    else if (pl.state !== 'dodge') { vis.rotation.y += (0 - vis.rotation.y) * Math.min(1, 12 * dt); vis.position.y += (0 - vis.position.y) * Math.min(1, 12 * dt); torso.rotation.x += (0 - torso.rotation.x) * Math.min(1, 12 * dt); torso.rotation.z += (0 - torso.rotation.z) * Math.min(1, 12 * dt); pl.combat = Math.max(0, pl.combat - dt); const ready = (!pl.weapon && pl.combat > 0) ? GUARD : REST; pl.pose = lerpPose(pl.pose, pl.weapon ? { x: -.72 - pl.rec * .25, y: 0, z: 0, t: 0 } : ready, Math.min(1, 12 * dt)); pl.rec = Math.max(0, pl.rec - dt * 5) }
    if (pl.state === 'dodge') { pl.st += dt; const D = DODGE.duration, k = Math.min(1, pl.st / D); const travel = (pl.werewolf ? (pl.rollBack ? 4.2 : 6.2) : DODGE.distance) / D; vx = pl.dx * travel; vz = pl.dz * travel; const tuck = Math.sin(Math.min(1, k * 1.35) * PI); if (pl.rollBack) { vis.rotation.x = -.08 - .16 * tuck; vis.position.y = .08 + tuck * .07; } else { { const th = PI * 2 * k, pe = 1.05, lift = .04 + .3 * Math.sin(k * PI); vis.scale.set(1, .90, 1); vis.position.y = pe - pe * Math.cos(th) + lift; if (pl.rollSide) { vis.rotation.x = 0; vis.rotation.z = -pl.rollSide * th; vis.position.x = -pl.rollSide * pe * Math.sin(th); vis.position.z = 0 } else { vis.rotation.x = th; vis.rotation.z = 0; vis.position.z = -pe * Math.sin(th); vis.position.x = 0 } } } if (pl.rollBack) vis.rotation.z = 0; if (!pl.rollBack) { if (pl.rollSide) { torso.rotation.x = .5; legL.rotation.x = -.95; legR.rotation.x = -.95 } else { torso.rotation.x = .62; legL.rotation.x = -.72; legR.rotation.x = .72 } } else { torso.rotation.x = -.12 - .12 * tuck; legL.rotation.x = -.55 * tuck; legR.rotation.x = .38 * tuck; } if (pl.st >= D) { pl.state = 'idle'; pl.iframe = 0; vis.position.set(0, 0, 0); vis.rotation.set(0, 0, 0); vis.scale.set(1, 1, 1); vis.position.set(0, 0, 0); torso.rotation.set(0, 0, 0); legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0); pl.pose = { ...GUARD }; pl.combat = .8; const queued = pl.dodgeQueued; pl.dodgeQueued = false; if (queued && pl.stamina > 0) { want.dodge = true; pl.dcd = 0 } } }
    pl.x += vx * dt; pl.z += vz * dt; push(pl, .45); pl.y = hgt(pl.x, pl.z);
    pl.walk += dt * (moving ? 11 : 0); const sw = moving ? .8 : 0; if (pl.state === 'attack') { const phase = Math.min(1, pl.atkT / ATK[pl.i].dur), q = Math.sin(phase * PI), wind = Math.sin(Math.min(1, phase * 2) * PI / 2), follow = Math.sin(Math.max(0, (phase - .42) / .58) * PI); if (!pl.weapon && !pl.werewolf) { armR.rotation.x = -1.15 + wind * 1.55 - follow * .9; armR.rotation.z = -.35 + q * .85; armL.rotation.x = -.75 + q * .45; armL.rotation.z = .25 - q * .5; torso.rotation.y = (pl.i === 1 ? -.55 : pl.i === 2 ? .62 : -.35) * q; torso.rotation.x = -.12 + wind * .24 - follow * .16; sword.rotation.x = -2.48 - wind * .85 + follow * 1.35; sword.rotation.y = (pl.i === 1 ? -.65 : pl.i === 2 ? .72 : .25) * q; sword.rotation.z = (pl.i === 1 ? .45 : pl.i === 2 ? -.5 : .25) * q; } if (pl.werewolf) { wolfArms[0].rotation.x = -q * 1.35; wolfArms[1].rotation.x = -q * 1.35; wolfArms[0].rotation.z = q * .65; wolfArms[1].rotation.z = -q * .65; wolfLegs[0].rotation.x = -q * .45; wolfLegs[1].rotation.x = q * .45; } legL.rotation.x = -.35 - q * .8; legR.rotation.x = .25 + q * .65; legL.rotation.z = -.08; legR.rotation.z = .08 } else { legL.rotation.x = Math.sin(pl.walk) * sw; legR.rotation.x = -Math.sin(pl.walk) * sw; legL.rotation.z = 0; legR.rotation.z = 0 } if (pl.state !== 'attack') armL.rotation.x = -Math.sin(pl.walk) * sw * .8; if (pl.werewolf) { wolfLegs[0].rotation.x = Math.sin(pl.walk) * sw; wolfLegs[1].rotation.x = -Math.sin(pl.walk) * sw; wolfLegs[2].rotation.x = -Math.sin(pl.walk) * sw; wolfLegs[3].rotation.x = Math.sin(pl.walk) * sw; wolfArms[0].rotation.x = -Math.sin(pl.walk) * sw * .7; wolfArms[1].rotation.x = Math.sin(pl.walk) * sw * .7; }
    armR.rotation.set(pl.pose.x, pl.pose.y, pl.pose.z); poseWeaponArms(game, dt); torso.rotation.y = pl.pose.t; if (pl.swapT > 0) swapAnim(game, dt);
    if (game.slashT > 0) { game.slashT = Math.max(0, game.slashT - dt); const f = game.slashT / .32; slashFx.visible = true; slashMat.opacity = .95 * f; slashGlow.material.opacity = .5 * f; slashFx.scale.set(1.05 + (1 - f) * .55, .9 + (1 - f) * .25, 1); slashFx.rotation.z = (pl.i === 1 ? -.8 : pl.i === 2 ? .85 : .2) + (1 - f) * .6; } else slashFx.visible = false;
    root.position.set(pl.x, pl.y, pl.z); root.rotation.y = pl.face; game.setWolfForm(false);
}
