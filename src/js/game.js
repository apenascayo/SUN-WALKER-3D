import { $, coinPop } from './dom.js';
import { rnd, tmp } from './math.js';
import { S, KB, DS, DK, saveSet } from './settings.js';
import { save } from './save.js';
import { createAudio } from './audio.js';
import { createVfx } from './vfx.js';
import { createWorld, hgt, applyVideo } from './world.js';
import { createPlayerVisuals } from './player/visuals.js';
import { createPlayerState, clearInputs, startSwap, hurtPlayer, updPlayer, updWeaponFx, aimPoint } from './player/controller.js';
import { bindCombat } from './combat.js';
import { createWaves } from './waves.js';

export function createGame() {
    const world = createWorld();
    const audio = createAudio(S);
    const vfx = createVfx(world.scene, S);
    const visuals = createPlayerVisuals(world.scene);
    const pl = createPlayerState(S);

    const game = {
        S, KB, DS, DK, saveSet,
        ...world,
        ...visuals,
        ...vfx,
        audio,
        pl,
        hgt,
        keys: {},
        mouse: new THREE.Vector2(),
        want: { dodge: false },
        enemies: [],
        bullets: [],
        coinsA: [],
        runes: [],
        enemyArrows: [],
        eid: 0,
        mode: 'menu',
        paused: false,
        running: false,
        hitstop: 0,
        shake: 0,
        slashT: 0,
        nightMix: 0,
        nightTarget: 0,
        nightLabel: 0,
        intro: null,
        menuT: 0,
        listen: null,
        pend: null,
        kt: null,
        skillTreeOpen: false,
        skillTreeWasPaused: false,
        merchantWasPaused: false,
        invOpen: false,
        invWasPaused: false,
        last: performance.now(),
        mapCanvas: $('mapCanvas'),
        mapCtx: $('mapCanvas').getContext('2d')
    };

    game.playSfx = (key, mult) => audio.playSfx(key, mult);
    game.setWeapon = (w) => visuals.setWeapon(pl, w);
    game.applyWeapon = (w) => visuals.applyWeapon(pl, w);
    game.setWolfForm = (on) => visuals.setWolfForm(pl, on);
    game.clearInputs = () => clearInputs(game);
    game.startSwap = (w) => startSwap(game, w);
    game.hurtPlayer = (d, nx, nz) => hurtPlayer(game, d, nx, nz);
    game.save = () => save(game);
    game.applyVideo = () => applyVideo(game);

    bindCombat(game);
    createWaves(game);

    return game;
}

export function update(game, dt) {
    const { pl, mode, paused, reticle, enemies, PT, coinsA, occ, scene, sun, torch, daySky, nightSky, dayFog, nightFog, dayHemi, nightHemi, daySun, nightSun } = game;
    $('merchantHint').style.display = (mode === 'play' && !paused && Math.hypot(pl.x + 7, pl.z - 6) < 3.2) ? 'block' : 'none';
    updPlayer(game, dt); game.updBullets(dt); game.updEnemyArrows(dt); game.updRunes(dt); game.updBurn(dt); updWeaponFx(game, dt);
    { const v = !!pl.weapon && pl.state !== 'dead'; reticle.visible = v; if (v) { const a = aimPoint(game); if (a) reticle.position.set(a.x, hgt(a.x, a.z) + .15, a.z) } }
    enemies.slice().forEach(e => game.updEnemy(e, dt));
    game.waves.update(dt);
    for (const q of PT) if (q.l > 0) { q.l -= dt; q.v.y -= q.g * dt; q.m.position.addScaledVector(q.v, dt); q.m.scale.multiplyScalar(1 - dt * 2); if (q.l <= 0) q.m.visible = false }
    for (let i = coinsA.length - 1; i >= 0; i--) {
        const c = coinsA[i], dx = pl.x - c.position.x, dz = pl.z - c.position.z, d = Math.hypot(dx, dz); c.rotation.z += dt * 4;
        const magnetRadius = [0, 4.5, 7.5, 12][pl.magnetLevel || 0]; if (d < magnetRadius && pl.state !== 'dead') { c.position.x += dx / (d || 1) * dt * (8 + pl.magnetLevel * 2); c.position.z += dz / (d || 1) * dt * (8 + pl.magnetLevel * 2) } else c.position.y = hgt(c.position.x, c.position.z) + .5 + Math.sin(pl.t * 3 + i) * .08;
        if (d < 1.1) { scene.remove(c); coinsA.splice(i, 1); pl.coins += c.userData.v || 1; coinPop(); game.playSfx('coins') }
    }
    for (const o of occ) { const near = o.z > pl.z && o.z - pl.z < 10 && Math.abs(o.x - pl.x) < 3; o.o += ((near ? .22 : 1) - o.o) * Math.min(1, 8 * dt); for (const m of o.ms) { m.opacity = o.o; m.transparent = o.o < .99 } }
    game.nightMix += (game.nightTarget - game.nightMix) * Math.min(1, dt * .42);
    const nightMix = game.nightMix;
    scene.background.copy(daySky).lerp(nightSky, nightMix); scene.fog.color.copy(dayFog).lerp(nightFog, nightMix); scene.fog.near = 26 - nightMix * 5; scene.fog.far = 68 - nightMix * 18; const hemi = scene.children.find(o => o.isHemisphereLight); if (hemi) { hemi.color.copy(dayHemi).lerp(nightHemi, nightMix); hemi.intensity = .85 - nightMix * .32; } sun.color.copy(daySun).lerp(nightSun, nightMix); sun.intensity = 1.5 - nightMix * .65; sun.position.set(pl.x - 18, pl.y + 22, pl.z + 10); sun.target.position.set(pl.x, pl.y, pl.z); torch.intensity = 1.1 + Math.random() * .5;
}

export function camUpdate(game, dt) {
    const { cam, camT, camOff, pl, S } = game;
    camT.set(pl.x, pl.y + 1, pl.z); cam.position.lerp(tmp.copy(camT).add(camOff), 1 - Math.exp(-6 * dt)); game.shake = Math.max(0, game.shake - dt * 2.5);
    const o = cam.position.clone(); o.x += rnd(-1, 1) * game.shake * .3 * S.shk; o.y += rnd(-1, 1) * game.shake * .3 * S.shk; const keep = cam.position.clone(); cam.position.copy(o); cam.lookAt(camT); cam.position.copy(keep).add(o.sub(keep))
}
