export const DS = { master: .8, music: .5, sfx: .8, amb: .5, ui: .7, q: 2, sh: 2, scale: 1, far: 70, fx: true, fps: 0, aim: 1, dn: true, shk: 1, vib: true, god: false };
export const DK = { atk: 'j', dodge: 'shift', weapon: 'r' };
export const S = { ...DS };
export const KB = { ...DK };
try { const a = JSON.parse(localStorage.getItem('sw_settings') || 'null'); if (a) { Object.assign(S, a.S); Object.assign(KB, a.KB) } } catch (e) { }

export const saveSet = () => { try { localStorage.setItem('sw_settings', JSON.stringify({ S, KB })) } catch (e) { } };

export function resetSettings() {
    Object.assign(S, DS);
    Object.assign(KB, DK);
}
