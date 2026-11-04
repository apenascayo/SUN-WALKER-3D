import { $, banner } from './dom.js';
import { rnd, tmp } from './math.js';
import { readSave, loadSkills } from './save.js';
import { createGame, update, camUpdate } from './game.js';
import { bindUI, bindInput, hud, refreshMenu } from './ui.js';
import { REST } from './player/controller.js';
import { hgt } from './world.js';

const game = createGame();
const { cam, camT, renderer, scene, root, vis, torso, torch, pl } = game;

function setMode(m) { game.mode = m; game.running = m === 'play'; document.body.dataset.m = m }

function reset() {
    game.clearInputs();
    pl.skills = loadSkills();
    game.sheathVisual.visible = !!pl.skills.sheath; game.slashT = 0; game.slashFx.visible = false;
    game.enemies.forEach(e => scene.remove(e.g)); game.enemies.length = 0;
    game.coinsA.forEach(c => scene.remove(c)); game.coinsA.length = 0;
    Object.assign(pl, { x: 0, z: 2, hp: 100, max: 100, lv: 1, xp: 0, coins: 0, ammo: 30, potions: 0, werewolf: false, stamina: 100, state: 'idle', last: -1, dcd: 0, iframe: 0, buf: 0, combat: 0, rollSide: 1, para: 0, lightningDash: null, pose: { ...REST } });
    game.setWolfForm(false); vis.rotation.x = 0; vis.scale.y = 1; vis.position.set(0, 0, 0); pl.swapT = 0; game.setWeapon(0);
    game.bullets.forEach(b => scene.remove(b.m)); game.bullets.length = 0;
    game.waves.reset(); game.audio.setMusicMode('normal'); game.nightTarget = 0; game.nightMix = 0;
    scene.background.copy(game.daySky); scene.fog.color.copy(game.dayFog); $('dead').classList.add('hide')
}

function beginPlay() {
    if (game.mode === 'play') return; game.clearInputs(); game.intro = null; setMode('play');
    $('skillBtn').classList.remove('hide'); torso.position.y = .9; pl.iframe = 1.5;
    root.position.set(pl.x, hgt(pl.x, pl.z), pl.z); game.waves.begin()
}

function skipIntro() {
    if (game.mode !== 'intro' || game.intro.skip) return; game.intro.skip = 1; $('fade').style.opacity = 1;
    setTimeout(() => { beginPlay(); $('fade').style.opacity = 0 }, 500)
}

function startGame(cont, skip) {
    game.clearInputs();['menu', 'dead', 'pause'].forEach(i => $(i).classList.add('hide')); game.paused = false; reset();
    const sv = cont ? readSave() : null; if (sv) { Object.assign(pl, { lv: sv.lv, xp: sv.xp, max: sv.max, hp: sv.max, coins: sv.coins, ammo: sv.ammo ?? 30, potions: sv.potions || 0, magnetLevel: sv.magnetLevel || 0, skills: { ...pl.skills, ...(sv.skills || {}) } }); game.setWeapon(sv.weapon || 0); game.waves.n = sv.wave }
    $('fade').style.opacity = 1;
    if (cont || skip) setTimeout(() => { $('fade').style.opacity = 0; beginPlay() }, 500); else { game.intro = { t: 0 }; setMode('intro'); setTimeout(() => $('fade').style.opacity = 0, 300) }
}

function retryCurrentWave() {
    game.clearInputs(); $('dead').classList.add('hide'); game.paused = false; pl.hp = pl.max; pl.stamina = pl.staminaMax; pl.state = 'idle'; pl.x = 0; pl.z = 2; pl.iframe = 1.5; pl.para = 0; pl.pose = { ...REST }; vis.rotation.set(0, 0, 0); vis.position.set(0, 0, 0);
    game.enemies.forEach(e => scene.remove(e.g)); game.enemies.length = 0; game.enemyArrows.forEach(a => scene.remove(a.m)); game.enemyArrows.length = 0; game.coinsA.forEach(c => scene.remove(c)); game.coinsA.length = 0; game.bullets.forEach(b => scene.remove(b.m)); game.bullets.length = 0;
    game.waves.q = game.waves.plan(Math.max(1, game.waves.n)); game.waves.st = 'active'; game.waves.sp = .8; game.waves.atkMax = Math.min(4, 2 + Math.floor(Math.max(1, game.waves.n) / 3));
    game.setNight(game.waves.n > 0 && game.waves.n % 5 === 0); setMode('play'); $('skillBtn').classList.remove('hide'); game.save()
}

function toMenu() {
    $('skillBtn').classList.add('hide'); game.paused = false;['pause', 'dead'].forEach(i => $(i).classList.add('hide')); reset(); setMode('menu'); $('menu').classList.remove('hide'); refreshMenu()
}

game.startGame = startGame;
game.skipIntro = skipIntro;
game.retryCurrentWave = retryCurrentWave;
game.toMenu = toMenu;

function menuCam(dt) {
    game.menuT += dt; game.stepPT(dt); const a = game.menuT * .12;
    cam.position.set(Math.sin(a) * 9, 3.4, 2 + Math.cos(a) * 9); cam.lookAt(0, 1.7, 2);
    root.position.set(0, 0, 2); root.rotation.y = Math.atan2(cam.position.x, cam.position.z - 2);
    torso.position.y = .9 + Math.sin(game.menuT * 2) * .01;
    if (Math.random() < .25) game.spark(tmp.set(rnd(-10, 10), rnd(.3, 3), rnd(-6, 10)), 0xe8b36a, 1, .4, .07, -.2);
    torch.intensity = 1 + Math.random() * .6
}

const K = [[34, 6, 26, 14, 2, -8], [-8, 4.5, 16, 0, 2, 0], [0, 12, 13, 0, 1, 2]];
function introCam(dt) {
    const intro = game.intro; intro.t += dt; const t = intro.t; game.stepPT(dt); let a, b, k; if (t < 4.5) { a = K[0]; b = K[1]; k = t / 4.5 } else { a = K[1]; b = K[2]; k = Math.min(1, (t - 4.5) / 3.5) } k = k * k * (3 - 2 * k);
    const L = i => a[i] + (b[i] - a[i]) * k; cam.position.set(L(0), L(1), L(2)); cam.lookAt(L(3), L(4), L(5)); root.position.set(0, 0, 2); root.rotation.y = 0; torso.position.y = .9 + Math.sin(t * 2) * .01; torch.intensity = 1 + Math.random() * .6;
    if (!intro.c1 && t > .8) { intro.c1 = 1; banner('Sertão de Pernambuco', '', 2200) }
    if (!intro.c2 && t > 3.4) { intro.c2 = 1; banner('O sol cai.', 'As sombras acordam.', 2400) }
    if (!intro.c3 && t > 5.8) { intro.c3 = 1; banner('SUN WALKER', '', 1800) }
    if (t >= 8) beginPlay()
}

function loop(now) {
    requestAnimationFrame(loop);
    { const cap = [0, 30, 60][game.S.fps]; if (cap && now - game.last < 1000 / cap - 2) return }
    const real = Math.min(.05, (now - game.last) / 1000); game.last = now; let dt = real;
    if (game.mode === 'play' && !game.paused) {
        if (game.hitstop > 0) { game.hitstop -= real; dt = 0 }
        update(game, dt); camUpdate(game, real); hud(game, real)
    } else if (game.mode === 'menu') menuCam(real);
    else if (game.mode === 'intro') introCam(real);
    renderer.render(scene, cam)
}

bindInput(game);
bindUI(game);
game.applyVideo();
refreshMenu();
setMode('menu');
cam.position.set(0, 3.4, 11);
setTimeout(() => { $('fade').style.opacity = 0 }, 150);
camT.set(0, 1, 2); cam.lookAt(camT);
requestAnimationFrame(loop);
