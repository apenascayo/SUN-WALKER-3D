import { test } from 'node:test';
import assert from 'node:assert/strict';

class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.set(x, y, z) }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this }
    copy(v) { return this.set(v.x, v.y, v.z) }
    subVectors(a, b) { return this.set(a.x - b.x, a.y - b.y, a.z - b.z) }
    addScaledVector(v, s) { return this.set(this.x + v.x * s, this.y + v.y * s, this.z + v.z * s) }
    length() { return Math.hypot(this.x, this.y, this.z) }
    normalize() { const n = this.length() || 1; return this.set(this.x / n, this.y / n, this.z / n) }
}
class Transform {
    constructor() {
        this.position = new Vector3();
        this.rotation = new Vector3();
        this.scale = new Vector3(1, 1, 1);
        this.scale.setScalar = s => this.scale.set(s, s, s);
        this.quaternion = { setFromUnitVectors() {} };
        this.visible = true;
    }
    clone() { return new Transform() }
    localToWorld(v) { return v }
}
class Resource { dispose() { this.disposed = true } }
class Mesh extends Transform { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material } }
let mouseTarget = null;
globalThis.THREE = {
    Vector3, Mesh, CylinderGeometry: Resource, MeshStandardMaterial: Resource,
    Plane: class {}, Raycaster: class { constructor() { this.ray = { intersectPlane: () => mouseTarget } } setFromCamera() {} }
};
const pips = { style: {}, children: Array.from({ length: 3 }, () => ({ classList: { add() {}, remove() {} } })) };
globalThis.document = { getElementById: () => pips };
const { createPlayerState, updPlayer, updWeaponFx, startAttack, throwScythe, startSwap, scytheAction } = await import('../src/js/player/controller.js');

function makeGame(weapon) {
    mouseTarget = null;
    const sceneObjects = new Set(), transform = () => new Transform();
    const pl = createPlayerState({ god: false });
    pl.weapon = weapon; pl.weaponOwned = true;
    const game = {
        pl, keys: {}, want: {}, S: { aim: 1 }, scene: { add: o => sceneObjects.add(o), remove: o => sceneObjects.delete(o) },
        vis: transform(), torso: transform(), armL: transform(), armR: transform(), sword: transform(), swordLeft: transform(), scythe: transform(),
        gun: transform(), legL: transform(), legR: transform(), root: transform(), wolfArms: [transform(), transform()],
        wolfLegs: [transform(), transform(), transform(), transform()], blade: { material: { emissive: { setHex() {} } } },
        enemies: [], slashMat: { color: { setHex() {} } }, slashGlow: { material: { color: { setHex() {} } } },
        slashFx: transform(), enemyArrows: [], mouse: {}, cam: {}, slashT: 0,
        hits: [], sounds: [], audio: { hammerImpact() { game.sounds.push('hammerImpact') } }, spark() {}, playSfx(key) { game.sounds.push(key) }, push() {}, hgt: () => 0,
        hitEnemy(e, a) { game.hits.push({ e, a }); game.hitstop = a.hs }, setWolfForm() {},
        setWeapon(w) { pl.weapon = w; game.scythe.visible = w === 2 }
    };
    return { game, pl, sceneObjects };
}
function advance(game, seconds) { for (let t = 0; t < seconds; t += .02) updPlayer(game, .02) }

test('mouse aiming controls the player and the scythe throw', () => {
    const { game, pl } = makeGame(2);
    mouseTarget = new Vector3(10, 0, pl.z);
    advance(game, .02);
    assert.ok(Math.abs(pl.face - Math.PI / 2) < .001);
    mouseTarget = new Vector3(pl.x, 0, pl.z - 10);
    throwScythe(game);
    assert.ok(pl.scytheThrow.dz < -.99);
});

test('sword runs at 1.5 times its original speed and keeps running during an attack', () => {
    const { game, pl } = makeGame(0);
    game.keys.w = 1;
    advance(game, .1);
    assert.ok(Math.abs(pl.z - 1.1) < .001);
    pl.buf = .28;
    const before = pl.z;
    advance(game, .1);
    assert.ok(Math.abs(pl.z - (before - .9)) < .001);
    assert.equal(pl.state, 'attack');
});

test('sword attacks hit both sides during the active window', () => {
    const { game, pl } = makeGame(0);
    const left = { x: -2, z: 2 }, right = { x: 2, z: 2 }, behind = { x: 0, z: -1 };
    game.enemies.push(left, right, behind); pl.buf = .28;
    advance(game, .25);
    assert.deepEqual(game.hits.map(h => h.e), [left, right]);
});

test('both swords animate as opposing crossed strikes', () => {
    const { game, pl } = makeGame(0);
    pl.buf = .28; advance(game, .12);
    assert.ok(Math.abs(game.sword.rotation.y) > .1);
    assert.equal(game.sword.rotation.y, -game.swordLeft.rotation.y);
    assert.equal(game.sword.rotation.z, -game.swordLeft.rotation.z);
});

test('idle sword pose angles both blades down in the opposite direction', () => {
    const { game } = makeGame(0);
    advance(game, 1);
    for (const [arm, sword] of [[game.armL, game.swordLeft], [game.armR, game.sword]]) {
        const angle = arm.rotation.x + sword.rotation.x;
        assert.ok(angle < 0 && angle > -Math.PI / 2);
    }
});

test('third scythe combo strike swings the hammer down and creates impact', () => {
    const { game, pl } = makeGame(2);
    startAttack(game, 2);
    advance(game, .12);
    const raised = game.scythe.rotation.x;
    const raisedHeight = game.scythe.position.y;
    advance(game, .2);
    assert.ok(game.scythe.rotation.x > raised);
    assert.ok(raisedHeight > .5 && game.scythe.position.y < 0);
    assert.equal(game.sounds.filter(s => s === 'hammerImpact').length, 1);
    assert.ok(game.sounds.includes('bomba'));
    updPlayer(game, 0); updPlayer(game, 0);
    assert.equal(game.sounds.filter(s => s === 'hammerImpact').length, 1);
    advance(game, .5);
    assert.equal(game.sounds.filter(s => s === 'hammerImpact').length, 1);
    assert.equal(pl.state, 'idle');
    assert.equal(game.scythe.position.y, .12);
});

test('unowned gun cannot be equipped', () => {
    const { game, pl } = makeGame(0);
    startSwap(game, 1);
    assert.equal(pl.weapon, 0);
    assert.ok(!pl.swapT);
});

test('elemental sword paths emit effects at both feet', () => {
    for (const [path, stage] of [['fire', 'fireStage'], ['storm', 'stormStage']]) {
        const { game, pl } = makeGame(0);
        const effect = () => ({ fire: { visible: false }, bolt: { visible: false } });
        game.wfx = { sw: effect(), gn: effect() };
        const sparks = [];
        game.spark = (pos, color) => sparks.push({ x: pos.x, color });
        pl.skills.swordPath = path; pl.skills[stage] = 1;
        updWeaponFx(game, .1);
        assert.equal(sparks.length, 2);
        assert.notEqual(sparks[0].x, sparks[1].x);
        assert.equal(sparks[0].color, path === 'fire' ? 0xff7624 : 0x6ce8ff);
        pl.weapon = 2; pl.footFxT = 0; updWeaponFx(game, .1);
        assert.equal(sparks.length, 2);
    }
});

test('forward sword dodge finds a farther, offset target', () => {
    const { game, pl } = makeGame(0);
    const target = { x: 1.1, z: 6, T: { sc: 1 } };
    game.enemies.push(target); game.want.dodge = true;
    advance(game, .65);
    assert.equal(game.hits.length, 1);
    assert.equal(game.hits[0].e, target);
    assert.ok(pl.z > target.z);
});

test('sword forward dodge vaults and cuts once with chance-based hitstop', () => {
    for (const [random, hitstop] of [[.25, .09], [.75, 0]]) {
        const { game, pl } = makeGame(0);
        const target = { x: 0, z: 4, T: { sc: 1 } };
        game.enemies.push(target);
        game.want.dodge = true;
        const oldRandom = Math.random; Math.random = () => random;
        try {
            advance(game, .28);
            assert.ok(game.vis.position.y > 1);
            advance(game, .4);
        } finally { Math.random = oldRandom }
        assert.equal(game.hits.length, 1);
        assert.equal(game.hits[0].a.hs, hitstop);
        assert.ok(pl.z > target.z);
        assert.equal(pl.state, 'idle');
    }
});

test('ordinary sword dodge remains unchanged without an enemy in front', () => {
    const { game, pl } = makeGame(0);
    game.enemies.push({ x: 4, z: 2 });
    game.want.dodge = true;
    advance(game, .5);
    assert.equal(game.hits.length, 0);
    assert.ok(pl.z < 2);
    assert.equal(pl.state, 'idle');
});

test('sword and all scythe attacks finish without interrupting updates', () => {
    for (const weapon of [0, 2]) for (const attack of [0, 1, 2]) {
        const { game, pl } = makeGame(weapon);
        startAttack(game, attack);
        advance(game, 1);
        assert.equal(pl.state, 'idle');
        game.keys.w = 1;
        const before = pl.z;
        advance(game, .1);
        assert.notEqual(pl.z, before);
    }
});

test('scythe combo queues two different cuts and one hammer strike', () => {
    const { game, pl } = makeGame(2);
    game.pl.buf = .28; advance(game, .02);
    assert.equal(pl.i, 0); assert.equal(pl.scytheMode, 'scythe');
    advance(game, .2);
    const firstSwing = game.scythe.rotation.z;
    pl.buf = .28; advance(game, .5);
    assert.equal(pl.i, 1); assert.equal(pl.scytheMode, 'scythe');
    advance(game, .2);
    assert.ok(firstSwing * game.scythe.rotation.z < 0);
    pl.buf = .28; advance(game, .5);
    assert.equal(pl.i, 2); assert.equal(pl.scytheMode, 'hammer');
    advance(game, .2);
    assert.ok(Math.abs(game.scythe.rotation.x) > .3);
    advance(game, 1);
    assert.equal(pl.state, 'idle');
});

test('pull and grapple require the actual attached target', () => {
    for (const type of ['grapple', 'pull']) {
        const { game, pl } = makeGame(2);
        const target = { x: 0, z: 8, T: { sc: 1 }, g: new Transform() };
        const other = { x: 2, z: 3, T: { sc: 1 }, g: new Transform() };
        game.enemies.push(target, other);
        assert.equal(scytheAction(game, type), false);
        throwScythe(game);
        assert.equal(scytheAction(game, type), false);
        advance(game, .3);
        assert.equal(pl.scytheThrow.target, target);
        assert.equal(scytheAction(game, type), true);
        const beforePlayer = pl.z, beforeTarget = target.z;
        advance(game, .1);
        if (type === 'grapple') { assert.ok(pl.z > beforePlayer); assert.equal(target.z, beforeTarget) }
        else { assert.equal(pl.z, beforePlayer); assert.ok(target.z < beforeTarget) }
        assert.equal(other.z, 3);
        advance(game, 1.5);
        assert.equal(game.hits.length, 1);
        assert.equal(game.hits[0].e, target);
        assert.equal(game.hits[0].a.dmg, 150);
        assert.equal(game.hits[0].a.hs, .21);
        assert.ok(game.sounds.includes('bomba'));
        assert.ok(game.sounds.includes('hammerImpact'));
        assert.equal(pl.scytheAction, null);
        assert.equal(pl.scytheThrow, null);
        assert.ok(Math.abs(target.z - pl.z) <= 1.21);
    }
});

test('grapple cancels safely if its hooked target dies', () => {
    const { game, pl } = makeGame(2);
    const target = { x: 0, z: 8, T: { sc: 1 }, g: new Transform() };
    game.enemies.push(target); throwScythe(game); advance(game, .3);
    assert.equal(scytheAction(game, 'grapple'), true);
    target.dead = true; advance(game, 1);
    assert.equal(pl.scytheAction, null);
    assert.equal(pl.scytheThrow, null);
    assert.equal(pl.iframe, 0);
});

test('both hooked actions jump before a single hammer impact', () => {
    for (const type of ['grapple', 'pull']) {
        const { game, pl } = makeGame(2);
        const target = { x: 0, z: 8, T: { sc: 1 }, g: new Transform() };
        game.enemies.push(target); throwScythe(game); advance(game, .3);
        scytheAction(game, type);
        while (pl.scytheAction?.phase === 'travel') updPlayer(game, .02);
        advance(game, .18);
        assert.ok(game.vis.position.y > 2.9);
        assert.ok(game.vis.rotation.x > 1);
        assert.equal(game.scythe.visible, true);
        assert.equal(game.hits.length, 0);
        advance(game, .23);
        assert.equal(game.hits.length, 1);
        assert.equal(game.hitstop, .21);
        updPlayer(game, 0); updPlayer(game, 0);
        assert.equal(game.hits.length, 1);
    }
});

test('defensive spin works without a target but not while weapon is thrown', () => {
    const { game, pl } = makeGame(2);
    assert.equal(scytheAction(game, 'spin'), true);
    advance(game, 1.3);
    assert.equal(pl.scytheAction, null);
    throwScythe(game);
    assert.equal(scytheAction(game, 'spin'), false);
});

test('a missed or dead target cannot be pulled or grappled', () => {
    const { game, pl } = makeGame(2);
    throwScythe(game); advance(game, .7);
    assert.equal(pl.scytheThrow.phase, 'return');
    assert.equal(scytheAction(game, 'pull'), false);
    assert.equal(scytheAction(game, 'grapple'), false);
    advance(game, 1);
    const target = { x: 0, z: 5, T: { sc: 1 }, g: new Transform() };
    game.enemies.push(target); throwScythe(game); advance(game, .2); target.dead = true;
    assert.equal(scytheAction(game, 'pull'), false);
    assert.equal(scytheAction(game, 'grapple'), false);
    advance(game, 1);
    assert.equal(pl.scytheThrow, null);
});

test('missed throw returns and restores the weapon', () => {
    const { game, pl, sceneObjects } = makeGame(2);
    assert.equal(throwScythe(game), true);
    assert.equal(game.scythe.visible, false);
    advance(game, 2);
    assert.equal(pl.scytheThrow, null);
    assert.equal(game.scythe.visible, true);
    assert.equal(sceneObjects.size, 0);
});

test('throw attaches to the first enemy, follows it and recalls with Q', () => {
    const { game, pl, sceneObjects } = makeGame(2);
    const target = { x: 0, z: 5, T: { sc: 1 } }, farther = { x: 0, z: 8, T: { sc: 1 } };
    game.enemies.push(farther, target);
    throwScythe(game);
    advance(game, .2);
    const action = pl.scytheThrow;
    assert.equal(action.phase, 'attached');
    assert.equal(action.target, target);
    assert.equal(action.rope.visible, true);
    target.x = 2;
    game.keys.d = 1;
    const previousX = pl.x;
    advance(game, .1);
    assert.equal(action.projectile.position.x, target.x + action.offsetX);
    assert.ok(pl.x > previousX);
    throwScythe(game);
    advance(game, 1);
    assert.equal(pl.scytheThrow, null);
    assert.equal(sceneObjects.size, 0);
});

test('dead targets return the scythe and switching weapons cleans it up', () => {
    const { game, pl, sceneObjects } = makeGame(2);
    const target = { x: 0, z: 5, T: { sc: 1 } };
    game.enemies.push(target);
    throwScythe(game);
    advance(game, .2);
    target.dead = true;
    advance(game, 1);
    assert.equal(pl.scytheThrow, null);
    throwScythe(game);
    const rope = pl.scytheThrow.rope;
    startSwap(game, 0);
    assert.equal(pl.scytheThrow, null);
    assert.equal(sceneObjects.size, 0);
    assert.equal(rope.geometry.disposed, true);
    assert.equal(rope.material.disposed, true);
});
