import { PI } from '../math.js';
import { mat, box } from '../world.js';

const limb = (w, h, c, x, y, p) => { const g = new THREE.Group(); g.position.set(x, y, 0); p.add(g); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat(c)); m.position.y = -h / 2; g.add(m); return g };
const SKIN = 0xa86a42, HAIR = 0x14100e, STRAW = 0xdcae4a, PANTS = 0x2c2b3a, TANK = 0xf4f4f2, SASH = 0x8f8a84, LEATH = 0x6e4526;

export function createPlayerVisuals(scene) {
    const root = new THREE.Group(), vis = new THREE.Group(); root.add(vis); scene.add(root);
    function leg(x) {
        const g = new THREE.Group(); g.position.set(x, .9, 0); vis.add(g);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(.235, .19, .74, 16), mat(PANTS)); p.position.y = -.37; g.add(p);
        const c = new THREE.Mesh(new THREE.CylinderGeometry(.19, .17, .12, 16), mat(0x1f1e2a)); c.position.y = -.78; g.add(c);
        box(.17, .06, .3, SKIN, 0, -.86, .04, g); box(.22, .04, .38, LEATH, 0, -.89, .04, g); box(.2, .05, .09, 0x4a2c18, 0, -.83, .08, g); return g
    }
    const legL = leg(-.17), legR = leg(.17), torso = new THREE.Group(); torso.position.y = .9; vis.add(torso);
    box(.64, .32, .42, PANTS, 0, .95, 0, vis); box(.62, .12, .4, 0x24232e, 0, 1.08, 0, vis); box(.66, .11, .44, SASH, 0, 1.0, 0, vis);
    box(.1, .5, .04, SASH, .13, .72, .23, vis); box(.12, .3, .045, 0x1e1d26, .13, .5, .235, vis); box(.06, .13, .05, 0xf4f4f2, .13, .52, .24, vis);
    const shirtParts = [
        new THREE.Mesh(new THREE.SphereGeometry(.31, 14, 12), mat(TANK)),
        new THREE.Mesh(new THREE.SphereGeometry(.37, 14, 12), mat(TANK)),
        new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), mat(TANK)),
        new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), mat(TANK))
    ];
    shirtParts[0].scale.set(1.06, .62, .78); shirtParts[0].position.set(0, .13, 0);
    shirtParts[1].scale.set(1.04, .92, .78); shirtParts[1].position.set(0, .46, 0);
    shirtParts[2].scale.set(.9, .48, .75); shirtParts[2].position.set(-.2, .66, 0);
    shirtParts[3].scale.set(.9, .48, .75); shirtParts[3].position.set(.2, .66, 0);
    shirtParts.forEach(m => torso.add(m));
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.08, .09, .14, 6), mat(SKIN)); neck.position.y = .7; torso.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), mat(SKIN)); head.position.y = .86; head.scale.set(.95, 1.08, 1); torso.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.245, 10, 8, 0, 2 * PI, 0, PI * .5), mat(HAIR)); hair.position.set(0, .88, -.015); torso.add(hair);
    box(.4, .3, .2, HAIR, 0, .8, -.13, torso); for (const x of [-.12, 0, .12]) box(.08, .1, .06, HAIR, x, .9, .2, torso);
    for (const x of [-.09, .09]) box(.05, .035, .03, 0x1a0f0a, x, .82, .2, torso);
    const hatG = new THREE.Group(); torso.add(hatG);
    const HM = (geo, c, x, y, z, p) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 1, side: THREE.DoubleSide })); m.position.set(x, y, z); p.add(m); return m };
    const HATS = {
        palha: { n: 'Chapéu de palha', p: 0, b: g => { HM(new THREE.ConeGeometry(.95, .5, 18, 1, true), STRAW, 0, 1.17, 0, g) } },
        negro: { n: 'Chapéu cônico negro', p: 30, b: g => { HM(new THREE.ConeGeometry(.9, .5, 14, 3, true), 0x23262b, 0, 1.2, 0, g); HM(new THREE.TorusGeometry(.9, .03, 4, 28), 0x15171a, 0, .95, 0, g).rotation.x = PI / 2; for (const s of [-1, 1]) HM(new THREE.BoxGeometry(.02, .4, .02), 0x15171a, s * .2, .75, .08, g) } },
        couro: { n: 'Chapéu de couro', p: 40, b: g => { HM(new THREE.SphereGeometry(.27, 12, 8, 0, 2 * PI, 0, PI / 2), 0x9c5a2c, 0, 1, 0, g).scale.y = .9; HM(new THREE.CylinderGeometry(.52, .49, .035, 18), 0xd2ae8a, 0, 1, 0, g); HM(new THREE.CylinderGeometry(.28, .285, .06, 14), 0xd2ae8a, 0, 1.03, 0, g); for (const s of [-1, 1]) { HM(new THREE.BoxGeometry(.02, .45, .02), 0xd2ae8a, s * .25, .76, .06, g); HM(new THREE.BoxGeometry(.02, .28, .02), 0xd2ae8a, s * .22, .52, .1, g) } } },
        mino: { n: 'Chapéu com capa de palha', p: 50, b: g => { HM(new THREE.ConeGeometry(.5, .5, 12, 1, true), 0xb8935a, 0, 1.2, 0, g); HM(new THREE.SphereGeometry(.045, 6, 5), 0x8a6a3a, 0, 1.46, 0, g); HM(new THREE.CylinderGeometry(.34, .5, .75, 16, 1, true), 0xa8844e, 0, .62, 0, g); for (let i = 0; i < 14; i++) { const a = i / 14 * 2 * PI; HM(new THREE.BoxGeometry(.06, .2, .03), 0x8a6a3a, Math.sin(a) * .5, .27, Math.cos(a) * .5, g).rotation.y = a } } },
        kabuto: {
            n: 'Elmo samurai com caveira', p: 80, b: g => {
                const D = 0x15110f, RD = 0xa3281f, BR = 0x4a3a2a, GD = 0xd9b46a; HM(new THREE.SphereGeometry(.28, 12, 8, 0, 2 * PI, 0, PI / 2), D, 0, 1, 0, g); HM(new THREE.CylinderGeometry(.29, .3, .05, 14), RD, 0, 1.01, 0, g); HM(new THREE.CylinderGeometry(.38, .38, .03, 16), BR, 0, 1.02, 0, g);
                for (let i = 0; i < 3; i++)HM(new THREE.CylinderGeometry(.3 + i * .07, .33 + i * .07, .08, 14, 1, true, PI * .5, PI), i % 2 ? RD : D, 0, .93 - i * .08, 0, g);
                for (const s of [-1, 1]) { HM(new THREE.BoxGeometry(.07, .42, .025), BR, s * .2, 1.4, 0, g).rotation.z = -s * .5; HM(new THREE.CylinderGeometry(.05, .05, .03, 10), GD, s * .3, 1.55, 0, g).rotation.x = PI / 2 }
                HM(new THREE.CylinderGeometry(.055, .055, .03, 10), GD, 0, 1.1, .28, g).rotation.x = PI / 2; HM(new THREE.SphereGeometry(.05, 8, 6), 0xe9dcc3, 0, 1.3, 0, g);
                HM(new THREE.BoxGeometry(.3, .34, .08), 0xe9dcc3, 0, .72, .225, g); for (const s of [-1, 1]) HM(new THREE.BoxGeometry(.08, .09, .03), D, s * .07, .79, .268, g); HM(new THREE.BoxGeometry(.035, .06, .03), D, 0, .7, .268, g); HM(new THREE.BoxGeometry(.22, .05, .03), 0xf3ead3, 0, .6, .268, g)
            }
        }
    };
    HATS.tengu = {
        n: 'Máscara Tengu', p: 90, b: g => {
            const R = 0xa3261c, R2 = 0x7e1c14, K = 0x15110f, W = 0xf3efe6;
            HM(new THREE.SphereGeometry(.27, 14, 10, 0, 2 * PI, 0, PI * .58), R2, 0, .92, -.01, g);
            HM(new THREE.SphereGeometry(.25, 14, 10), R, 0, .86, .1, g).scale.set(.95, 1.2, .62);
            HM(new THREE.ConeGeometry(.055, .36, 8), R, 0, .82, .4, g).rotation.x = PI / 2 + .12; HM(new THREE.SphereGeometry(.07, 8, 6), R, 0, .83, .24, g);
            for (const s of [-1, 1]) {
                HM(new THREE.BoxGeometry(.1, .065, .03), W, s * .095, .9, .255, g).rotation.z = s * .25; HM(new THREE.BoxGeometry(.03, .04, .03), K, s * .095, .9, .272, g);
                HM(new THREE.BoxGeometry(.15, .035, .03), K, s * .12, .98, .25, g).rotation.z = -s * .4; HM(new THREE.TorusGeometry(.03, .012, 5, 8), K, s * .2, 1.0, .23, g)
            }
            HM(new THREE.TorusGeometry(.04, .014, 5, 8), K, 0, 1.1, .16, g);
            for (let i = 0; i < 3; i++) { const c = HM(new THREE.ConeGeometry(.04, .22, 5), K, (i - 1) * .07, .58, .2, g); c.rotation.x = PI - .25; c.rotation.z = (i - 1) * .25 }
            HM(new THREE.BoxGeometry(.1, .03, .03), K, 0, .67, .27, g)
        }
    };
    HATS.oni = {
        n: 'Máscara Oni', p: 110, b: g => {
            const G = 0xb9bec0, GD = 0x7c8386, GO = 0xc9a24a, IV = 0xefe6cf, K = 0x14100e;
            HM(new THREE.SphereGeometry(.27, 14, 10, 0, 2 * PI, 0, PI * .58), G, 0, .92, -.01, g);
            HM(new THREE.SphereGeometry(.25, 14, 10), G, 0, .86, .1, g).scale.set(.98, 1.2, .62);
            for (const s of [-1, 1]) {
                HM(new THREE.ConeGeometry(.075, .55, 8), GO, s * .17, 1.2, -.02, g).rotation.z = -s * .35; HM(new THREE.TorusGeometry(.08, .018, 6, 12), GO, s * .15, 1.06, -.02, g).rotation.x = PI / 2;
                HM(new THREE.BoxGeometry(.17, .05, .07), GD, s * .09, .96, .25, g).rotation.z = s * .3; HM(new THREE.BoxGeometry(.09, .05, .03), K, s * .085, .9, .268, g).rotation.z = s * .35;
                HM(new THREE.TorusGeometry(.045, .012, 5, 10), GD, s * .16, .8, .22, g); HM(new THREE.TorusGeometry(.022, .01, 5, 8), GD, s * .16, .8, .235, g);
                HM(new THREE.ConeGeometry(.032, .2, 6), IV, s * .09, .67, .27, g).rotation.z = -s * .15
            }
            HM(new THREE.BoxGeometry(.07, .1, .07), G, 0, .82, .27, g); HM(new THREE.BoxGeometry(.24, .08, .03), K, 0, .68, .262, g);
            HM(new THREE.BoxGeometry(.2, .03, .03), IV, 0, .715, .272, g); HM(new THREE.BoxGeometry(.2, .03, .03), IV, 0, .645, .272, g); HM(new THREE.BoxGeometry(.28, .1, .1), G, 0, .58, .2, g)
        }
    };
    const hipG = new THREE.Group(); vis.add(hipG);
    const swordHip = new THREE.Group(); swordHip.position.set(-.24, 1.12, -.34); swordHip.rotation.set(.08, 0, .52); hipG.add(swordHip); box(.09, .7, .09, LEATH, 0, -.38, 0, swordHip); box(.11, .05, .11, 0xe8b23a, 0, -.03, 0, swordHip);
    const swordHipBlade = new THREE.Group(); swordHip.add(swordHipBlade); box(.06, .2, .06, 0x4a2c18, 0, .12, 0, swordHipBlade); box(.22, .04, .07, 0xe8b23a, 0, .01, 0, swordHipBlade); swordHipBlade.visible = false;
    const gunHip = new THREE.Group(); gunHip.position.set(.20, 1.08, -.36); gunHip.rotation.set(.08, 0, -.24); hipG.add(gunHip); box(.16, .14, .62, 0x4b2b1b, 0, 0, 0, gunHip); box(.07, .07, .72, 0x29282a, 0, .02, .52, gunHip);
    const gunHipButt = new THREE.Group(); gunHip.add(gunHipButt); box(.16, .15, .28, 0x65402a, 0, 0, -.38, gunHipButt);
    const SHIRTS = [{ n: 'Branca', c: 0xf4f4f2, p: 0 }, { n: 'Vermelha', c: 0xb3342a, p: 10 }, { n: 'Azul', c: 0x2f5d9c, p: 10 }, { n: 'Verde', c: 0x3f7a3d, p: 10 }, { n: 'Preta', c: 0x25252b, p: 10 }, { n: 'Ocre', c: 0xc08a2e, p: 10 }, { n: 'Roxa', c: 0x6a3d8f, p: 10 }];
    const COS = { hat: 'palha', shirt: 0xf4f4f2, hats: ['palha'], shirts: [0xf4f4f2] };
    try { Object.assign(COS, JSON.parse(localStorage.getItem('sw_cos') || '{}')) } catch (e) { }
    if (!Array.isArray(COS.hats)) COS.hats = ['palha']; if (!Array.isArray(COS.shirts)) COS.shirts = [0xf4f4f2];
    const saveCos = () => { try { localStorage.setItem('sw_cos', JSON.stringify(COS)) } catch (e) { } };
    function setHat(id) { if (!HATS[id]) id = 'palha'; COS.hat = id; hatG.children.slice().forEach(c => hatG.remove(c)); hatG.scale.setScalar(['tengu', 'oni', 'kabuto', 'mino', 'negro'].includes(id) ? 1.24 : 1.12); HATS[id].b(hatG) }
    function setShirt(c) { COS.shirt = c; shirtParts.forEach(m => m.material.color.setHex(c)) }
    setHat(COS.hat); setShirt(COS.shirt);
    const armL = limb(.2, .7, SKIN, -.43, .62, torso), armR = limb(.2, .7, SKIN, .43, .62, torso);
    for (const a of [armL, armR]) { const hand = new THREE.Mesh(new THREE.SphereGeometry(.105, 10, 8), mat(SKIN)); hand.position.set(0, -.72, .025); a.add(hand); for (let f = 0; f < 3; f++) { const finger = new THREE.Mesh(new THREE.CylinderGeometry(.022, .028, .13, 6), mat(SKIN)); finger.position.set((f - 1) * .045, -.76, .09); finger.rotation.x = -.5; a.add(finger) } }
    const sword = new THREE.Group(); sword.position.set(0, -.7, .08); sword.rotation.x = -2.48; armR.add(sword);
    box(.075, .30, .075, 0x4a2c18, 0, -.08, 0, sword); box(.40, .055, .10, 0xe8b23a, 0, -.25, 0, sword);
    const blade = box(.105, 1.42, .035, 0xdfe6ec, 0, -.99, 0, sword); blade.material.emissive = new THREE.Color(0x223344);
    const swordLeft = sword.clone(true); armL.add(swordLeft);
    const sheathVisual = box(.12, .82, .13, LEATH, .34, .42, -.2, vis); sheathVisual.rotation.z = -.12; sheathVisual.visible = false;
    const gun = new THREE.Group(); gun.position.set(0, .22, .54); gun.visible = false; torso.add(gun);
    // Arma híbrida: cabo longo, lâmina curva de foice e cabeça pesada de marreta.
    const scythe = new THREE.Group(); scythe.position.set(0, .12, .48); scythe.visible = false; torso.add(scythe);
    const scytheHandle = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, 1.65, 8), mat(0x49301d)); scytheHandle.rotation.x = -.18; scytheHandle.position.y = -.55; scythe.add(scytheHandle);
    const gripA = new THREE.Mesh(new THREE.TorusGeometry(.065, .018, 5, 10), mat(0xb58a4a)); gripA.position.set(0, -.05, 0); scythe.add(gripA);
    const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(.66, .28, .26), mat(0x45464a)); hammerHead.position.set(.28, .25, 0); scythe.add(hammerHead);
    const hammerCap = new THREE.Mesh(new THREE.BoxGeometry(.12, .34, .32), mat(0x9b8155)); hammerCap.position.set(.62, .25, 0); scythe.add(hammerCap);
    const scytheBlade = new THREE.Mesh(new THREE.TorusGeometry(.48, .075, 8, 24, Math.PI * .78), mat(0xcbd1d5)); scytheBlade.position.set(-.36, .42, 0); scytheBlade.rotation.z = Math.PI * .12; scythe.add(scytheBlade);
    const scytheBladeTip = new THREE.Mesh(new THREE.ConeGeometry(.09, .28, 6), mat(0xdfe5e8)); scytheBladeTip.position.set(-.72, .64, 0); scytheBladeTip.rotation.z = -.8; scythe.add(scytheBladeTip);
    const tetherCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.68, .55, .02), new THREE.Vector3(-.38, .18, .08), new THREE.Vector3(.02, .08, .08), new THREE.Vector3(.28, .25, .02)]);
    const tether = new THREE.Mesh(new THREE.TubeGeometry(tetherCurve, 16, .018, 5, false), mat(0x8b6840)); scythe.add(tether);
    box(.19, .16, .58, 0x4b2b1b, 0, -.015, -.20, gun); box(.22, .13, .32, 0x65402a, 0, .005, -.48, gun);
    box(.15, .12, .44, 0x29282a, 0, .02, .16, gun); box(.075, .075, .82, 0x242326, 0, .035, .70, gun);
    const barrelTip = new THREE.Mesh(new THREE.CylinderGeometry(.052, .052, .10, 10), mat(0x171719)); barrelTip.rotation.x = PI / 2; barrelTip.position.set(0, .035, 1.12); gun.add(barrelTip);
    box(.12, .29, .10, 0x29282a, 0, -.20, .13, gun); box(.14, .10, .18, 0x242326, 0, -.22, .16, gun);
    const trigger = new THREE.Mesh(new THREE.TorusGeometry(.075, .012, 5, 12, PI), mat(0x171719)); trigger.position.set(0, -.105, -.015); trigger.rotation.x = PI / 2; gun.add(trigger);
    box(.055, .07, .06, 0x171719, 0, .12, .30, gun); box(.045, .055, .05, 0x171719, 0, .12, .95, gun);
    const wfx = (() => {
        const mk = (parent, y0, y1, n) => {
            const fire = new THREE.Group(), bolt = new THREE.Group(); parent.add(fire, bolt); fire.visible = bolt.visible = false; const F = [], B = [], cs = [0xff3a12, 0xff8a1e, 0xffc93a];
            for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * i / (n - 1); for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(.08, .34, 5), new THREE.MeshBasicMaterial({ color: cs[(i + (s > 0 ? 1 : 0)) % 3], transparent: true, opacity: .85, depthWrite: false })); c.position.set(s * .1, y, 0); c.rotation.z = -s * PI / 2.6; fire.add(c); F.push({ c, i }) } }
            for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.03, .3, .03), new THREE.MeshBasicMaterial({ color: 0x7fe9ff, transparent: true, opacity: .95, depthWrite: false })); bolt.add(b); B.push(b) }
            return { fire, bolt, F, B, y0, y1, tb: 0 }
        }; return { sw: mk(sword, -.35, -1.6, 6), gn: mk(gun, -.25, -1, 4) }
    })();
    box(.08, .8, .1, 0x3a2218, -.4, .95, -.1, vis).rotation.z = .8;
    vis.traverse(m => { if (m.isMesh) m.castShadow = true });
    const humanMeshes = []; vis.traverse(m => { if (m.isMesh) humanMeshes.push(m) });
    const wolf = new THREE.Group(); wolf.visible = false; vis.add(wolf);
    const fur = mat(0x51483f), furDark = mat(0x211d1b), muzzle = mat(0x9b8878), eye = mat(0xffb52e), clawMat = mat(0xd8d0bd);
    const wTorso = new THREE.Mesh(new THREE.BoxGeometry(.78, .72, .48), fur); wTorso.position.set(0, .78, 0); wolf.add(wTorso);
    const wChest = new THREE.Mesh(new THREE.BoxGeometry(.62, .48, .52), furDark); wChest.position.set(0, .57, .12); wolf.add(wChest);
    const wHead = new THREE.Mesh(new THREE.SphereGeometry(.31, 10, 8), fur); wHead.position.set(0, 1.38, .12); wHead.scale.set(1, 1.05, 1.12); wolf.add(wHead);
    const wSnout = new THREE.Mesh(new THREE.ConeGeometry(.17, .48, 7), muzzle); wSnout.rotation.x = PI / 2; wSnout.position.set(0, 1.29, .43); wolf.add(wSnout);
    for (const x of [-.2, .2]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(.12, .38, 5), furDark); ear.position.set(x, 1.7, .04); ear.rotation.z = x < 0 ? .18 : -.18; wolf.add(ear); const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 5), eye); eyeMesh.position.set(x * .72, 1.43, .39); wolf.add(eyeMesh) }
    const wolfLegs = []; for (const x of [-.23, .23]) for (const z of [-.13, .18]) { const l = new THREE.Group(); l.position.set(x, .52, z); const seg = new THREE.Mesh(new THREE.BoxGeometry(.2, .62, .22), furDark); seg.position.y = -.25; l.add(seg); const paw = new THREE.Mesh(new THREE.BoxGeometry(.25, .14, .3), fur); paw.position.set(0, -.53, .08); l.add(paw); for (let c = -1; c <= 1; c++) { const claw = new THREE.Mesh(new THREE.ConeGeometry(.035, .18, 5), clawMat); claw.rotation.x = PI / 2; claw.position.set(c * .07, -.57, .22); l.add(claw) } wolf.add(l); wolfLegs.push(l) }
    const wolfArms = []; for (const x of [-.48, .48]) { const a = new THREE.Group(); a.position.set(x, 1.02, .05); const arm = new THREE.Mesh(new THREE.BoxGeometry(.2, .62, .22), fur); arm.position.y = -.25; a.add(arm); for (let c = -1; c <= 1; c++) { const claw = new THREE.Mesh(new THREE.ConeGeometry(.045, .24, 5), clawMat); claw.rotation.x = PI / 2; claw.position.set(c * .07, -.57, .16); a.add(claw) } wolf.add(a); wolfArms.push(a) }
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(.07, .16, .85, 7), furDark); tail.position.set(0, .85, -.55); tail.rotation.x = -.9; wolf.add(tail);

    const reticle = new THREE.Mesh(new THREE.RingGeometry(.35, .45, 24), new THREE.MeshBasicMaterial({ color: 0xff5a3a, side: THREE.DoubleSide, transparent: true, opacity: .85, depthTest: false })); reticle.rotation.x = -PI / 2; reticle.visible = false; reticle.renderOrder = 5; scene.add(reticle);
    const slashFx = new THREE.Group(); slashFx.visible = false; root.add(slashFx); slashFx.position.set(0, 1.28, .92); slashFx.rotation.x = PI / 2;
    const slashMat = new THREE.MeshBasicMaterial({ color: 0xffe6a3, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const slashCore = new THREE.Mesh(new THREE.TorusGeometry(1.05, .055, 6, 32, PI * .92), slashMat); slashFx.add(slashCore);
    const slashGlow = new THREE.Mesh(new THREE.TorusGeometry(1.05, .12, 5, 32, PI * .92), new THREE.MeshBasicMaterial({ color: 0xff9b3d, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); slashFx.add(slashGlow);
    const bgeo = new THREE.SphereGeometry(.1, 6, 5);

    function setWeapon(pl, w) { pl.weapon = w; sword.visible = swordLeft.visible = w === 0; gun.visible = w === 1; scythe.visible = w === 2; reticle.visible = w === 1; swordHipBlade.visible = w !== 0; gunHip.visible = gunHipButt.visible = !!pl.gunOwned && w !== 1; pl.buf = 0; pl.rec = 0 }
    function applyWeapon(pl, w) { setWeapon(pl, w); }
    function setWolfForm(pl, on) { hatG.visible = !on; hipG.visible = !on; wolf.visible = !!on; humanMeshes.forEach(m => m.visible = !on); sheathVisual.visible = !on && !!pl.skills.sheath; }

    return {
        root, vis, torso, head, hatG, hipG, legL, legR, armL, armR,
        sword, swordLeft, gun, scythe, blade, sheathVisual, swordHip, swordHipBlade, gunHip, gunHipButt,
        wolf, wolfLegs, wolfArms, humanMeshes, shirtParts, HATS, SHIRTS, COS, saveCos,
        setHat, setShirt, setWeapon, applyWeapon, setWolfForm, wfx, reticle, slashFx, slashMat, slashGlow, bgeo
    };
}
