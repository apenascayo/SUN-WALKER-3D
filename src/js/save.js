export function readSave() { try { return JSON.parse(localStorage.getItem('sw_save')) } catch (e) { return null } }

export function save(game) {
    const { pl, waves } = game;
    try { localStorage.setItem('sw_save', JSON.stringify({ lv: pl.lv, xp: pl.xp, max: pl.max, coins: pl.coins, weapon: pl.weapon, ammo: pl.ammo, wave: waves.n, potions: pl.potions || 0, magnetLevel: pl.magnetLevel || 0, skills: pl.skills })) } catch (e) { }
}

export function saveSkills(game) {
    try { localStorage.setItem('sw_skills', JSON.stringify(game.pl.skills)) } catch (e) { }
    save(game);
}

export function loadSkills() {
    const defaults = { explosive: false, lightning: false, swordPath: null, fireStage: 0, stormStage: 0, sheath: false, repel: false, points: 0 };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem('sw_skills') || '{}') } } catch (e) { return { ...defaults } }
}

export const need = l => 40 + l * 20;
