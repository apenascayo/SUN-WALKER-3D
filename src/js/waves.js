import { banner, coinPop } from './dom.js';
import { PI, rnd, tmp } from './math.js';

export function bossName(game) {
    return ['Mapinguari', 'Quibungo', 'Gorjala'][(Math.floor(game.waves.n / 5) - 1 + 3) % 3];
}

export function setNight(game, on) {
    game.audio.setMusicMode(on ? 'wolf' : 'normal');
    game.nightTarget = on ? 1 : 0;
    game.nightLabel = on ? 1 : 0;
    if (on) game.audio.wolfHowl();
    game.pl.werewolf = false;
    game.setWolfForm(false);
    banner(on ? 'A NOITE CAIU' : 'O SOL RETORNA', on ? 'As sombras estão 30% mais fortes e 10% mais rápidas' : 'O sertão volta à luz do dia', 2600);
    game.playSfx('waveup');
}

export function createWaves(game) {
    const WV = {
        n: 0, q: [], st: 'idle', t: 0, atkMax: 2, sp: 0, pts: [], lastP: null,
        df() { const n = Math.max(1, this.n), night = this.n > 0 && this.n % 5 === 0; return { hp: (1 + .07 * n) * (night ? 1.3 : 1), dmg: (1 + .04 * n) * (night ? 1.3 : 1), sp: (1 + .015 * n) * (night ? 1.1 : 1) } },
        init() { for (let i = 0; i < 8; i++) { const a = i * PI / 4 + .3, r = i % 2 ? 32 : 26; this.pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r }) } },
        reset() {
            game.enemies.forEach(e => game.scene.remove(e.g)); game.enemies.length = 0;
            game.enemyArrows.forEach(a => game.scene.remove(a.m)); game.enemyArrows.length = 0;
            game.runes.forEach(r => game.scene.remove(r.m)); game.runes.length = 0;
            this.n = 0; this.st = 'idle'; this.q = []; game.pl.para = 0;
        },
        begin() { this.st = 'banner'; this.t = 1.2 },
        plan(n) {
            const q = [], night = n % 5 === 0, c = Math.min(22, Math.ceil((5 + 2 * n) * (night ? 1.15 : 1))), up = n >= 3 ? Math.min(.6, (n - 2) * .12) : 0;
            for (let i = 0; i < c; i++) { const r = Math.random(); let t = 'S'; if (n >= 2 && r > .47) t = 'M'; if (n >= 4 && r > .84) t = 'L'; if (n >= 3 && r > .76 && r <= .84) t = 'A'; if (n >= 4 && r > .68 && r <= .75) t = 'F'; if (n >= 6 && r > .60 && r <= .68) t = 'G'; if (n >= 5 && r > .54 && r <= .60) t = 'K'; q.push([t, Math.random() < up]) }
            if (n >= 3 && !q.some(v => v[0] === 'A')) q[Math.floor(q.length * .55)] = ['A', false];
            if (n % 5 === 0) { for (let i = 0; i < q.length; i++)q[i] = ['W', false]; q.unshift(['B', true]) } return q
        },
        spawn(t, u) {
            let p, k = 0; do { p = this.pts[Math.floor(Math.random() * 8)]; k++ } while ((p === this.lastP || Math.hypot(p.x - game.pl.x, p.z - game.pl.z) < 14) && k < 12); this.lastP = p;
            const o = { x: p.x + rnd(-2, 2), z: p.z + rnd(-2, 2) }; game.push(o, 1); const e = game.mkEnemy(o.x, o.z, t, u, this.df()); e.hx = p.x; e.hz = p.z; game.spark(tmp.set(o.x, .5, o.z), 0x58ff7a, 12, 4, .15, -2)
        },
        left() { return this.q.length + game.enemies.filter(e => !e.dead && !e.clone).length },
        update(dt) {
            if (this.st === 'banner') { this.t -= dt; if (this.t <= 0) { this.n++; this.q = this.plan(this.n); setNight(game, this.n % 5 === 0); this.atkMax = Math.min(4, 2 + Math.floor(this.n / 3)); this.st = 'active'; this.sp = 0; game.playSfx('waveup'); banner('Onda ' + this.n, this.n % 5 === 0 ? 'CHEFE: ' + bossName(game) : 'Sobreviva às sombras', 2600) } }
            else if (this.st === 'active') {
                this.sp -= dt; const act = game.enemies.filter(e => !e.dead && !e.clone).length;
                if (this.q.length && this.sp <= 0 && act < Math.min(15, Math.ceil((5 + this.n * 2) * (this.n % 5 === 0 ? 1.15 : 1)))) { this.sp = this.n <= 2 ? .48 : .62; const a = this.q.shift(); this.spawn(a[0], a[1]) }
                if (!this.q.length && act === 0 && game.pl.state !== 'dead') this.done()
            }
            else if (this.st === 'rest') { this.t -= dt; if (this.t <= 0) { this.st = 'banner'; this.t = .5 } }
        },
        done() {
            this.st = 'rest'; this.t = 5; if (this.n % 5 === 0) setNight(game, false); game.enemies.forEach(e => { if (e.clone && !e.dead) { e.dead = true; e.dt = 0 } });
            const n = this.n, co = 5 + n * 2, xp = 15 + n * 5, boss = n % 5 === 0; game.pl.coins += co + (boss ? 50 : 0); coinPop(); game.gainXp(xp); const oldHp = game.pl.hp; game.pl.hp = boss ? game.pl.max : Math.min(game.pl.max, game.pl.hp + game.pl.max * .25); if (game.pl.hp > oldHp) game.playSfx('cura');
            banner('Onda ' + n + ' concluída', '+' + co + ' moedas · +' + xp + ' XP' + (boss ? ' · recompensa especial: +50 moedas e vida restaurada' : ''), 3600); game.save()
        }
    };
    WV.init();
    game.waves = WV;
    game.setNight = (on) => setNight(game, on);
    game.bossName = () => bossName(game);
    return WV;
}
