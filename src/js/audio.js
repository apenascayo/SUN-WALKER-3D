const AUDIO_ROOT = 'assets/audio/';
const MUSIC_TRACKS = [
    'combaiao_determinado.wav',
    'sertao_de_lampadas_1.wav',
    'sertao_do_shakuhachi.wav',
    'sertao_do_shakuhachi_2.wav'
];
const SFX_FILES = {
    merchant: 'merchant.mp3', shield: 'shield.mp3', sword: 'sword.mp3', arrow: 'arrow.mp3',
    bainha: 'bainha.mp3', balas: 'balas.mp3', bomba: 'bomba.mp3', coins: 'coins.mp3',
    cura: 'cura.mp3', danoeletrico: 'danoeletrico.mp3', dash: 'dash.mp3', hurtnpc: 'hurtnpc.mp3',
    level: 'level.mp3', magic: 'magic.mp3', mudancaarma: 'mudançaarma.mp3',
    nunlaugh: 'nun-laugh.mp3', openbag: 'openbag.mp3', recharge: 'recharge-gun.wav',
    somdor: 'somdor.mp3', sowrdinimigo: 'sowrdinimigo.mp3', swordnpc: 'swordnpc.mp3',
    trabuco: 'trabuco.mp3', waveup: 'waveup.mp3', xp: 'xp.mp3'
};
const WOLF_TRACKS = ['vaqueiro_entoada.wav', 'vaqueiro_entoada_2.wav'];

export function createAudio(S) {
    const sfxCache = {};
    for (const [key, file] of Object.entries(SFX_FILES)) { const a = new Audio(encodeURI(AUDIO_ROOT + 'sfx/' + file)); a.preload = 'auto'; sfxCache[key] = a }
    const musicAudio = new Audio(); musicAudio.preload = 'auto'; musicAudio.loop = false;
    let musicOrder = [], musicIndex = 0, musicStarted = false;
    let musicMode = 'normal', lastWolf = '';
    let ac, ambG, ambOn = false;
    const bossHowlAudio = new Audio('assets/audio/sfx/werewolf_howl.mp3'); bossHowlAudio.preload = 'auto'; bossHowlAudio.volume = .72;

    function shuffleMusic() { musicOrder = [...MUSIC_TRACKS]; for (let i = musicOrder.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[musicOrder[i], musicOrder[j]] = [musicOrder[j], musicOrder[i]] } musicIndex = 0 }
    function setMusicMode(m) { if (m === musicMode) return; musicMode = m; if (musicStarted) playNextMusic() }
    function playNextMusic() { let track; if (musicMode === 'wolf') { const o = WOLF_TRACKS.filter(t => t !== lastWolf); track = lastWolf = o[Math.floor(Math.random() * o.length)] } else { if (!musicOrder.length || musicIndex >= musicOrder.length) shuffleMusic(); track = musicOrder[musicIndex++] } musicAudio.src = encodeURI(AUDIO_ROOT + 'music/' + track); musicAudio.volume = Math.max(0, Math.min(1, S.master * S.music)); musicAudio.play().catch(() => { }); }
    function startMusic() { if (musicStarted) return; musicStarted = true; shuffleMusic(); playNextMusic() }
    musicAudio.addEventListener('ended', playNextMusic);
    function playSfx(key, mult = 1) { const base = sfxCache[key]; if (!base) return; const a = base.cloneNode(); a.volume = Math.max(0, Math.min(1, S.master * S.sfx * mult)); a.currentTime = 0; a.play().catch(() => { }); return a; }
    function snd(f, d, type = 'square', v = .06, f2, ch) { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime; o.type = type; o.frequency.setValueAtTime(f, n); o.frequency.exponentialRampToValueAtTime(f2 || f * .5, n + d); g.gain.setValueAtTime(Math.max(.0002, v * S.master * S[ch || 'sfx'] * 2), n); g.gain.exponentialRampToValueAtTime(.001, n + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(n + d) }
    function wolfHowl() { if (!ac) return; const now = ac.currentTime; for (let i = 0; i < 2; i++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(i ? 420 : 310, now); o.frequency.exponentialRampToValueAtTime(i ? 250 : 180, now + 2.4); g.gain.setValueAtTime(.0001, now); g.gain.linearRampToValueAtTime(.11, now + .35); g.gain.exponentialRampToValueAtTime(.0001, now + 2.6); o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now + 2.7) } }
    function playBossHowl() { try { const a = bossHowlAudio.cloneNode(); a.volume = .72; a.play().catch(() => { }); } catch (e) { } }
    const setVols = () => { musicAudio.volume = Math.max(0, Math.min(1, S.master * S.music)); if (ambG) ambG.gain.value = S.master * S.amb * .12 };
    function startAmb() {
        if (ambOn || !ac) return; ambOn = true; ambG = ac.createGain(); ambG.connect(ac.destination);
        const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++)d[i] = Math.random() * 2 - 1; const ns = ac.createBufferSource(), bp = ac.createBiquadFilter(), lf = ac.createOscillator(), lg = ac.createGain(); ns.buffer = nb; ns.loop = true; bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .6; lf.frequency.value = .1; lg.gain.value = 200; lf.connect(lg); lg.connect(bp.frequency); ns.connect(bp); bp.connect(ambG); ns.start(); lf.start(); setVols()
    }
    function unlock() {
        if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') ac.resume();
        startAmb(); startMusic();
    }

    return { playSfx, playNextMusic, startMusic, setMusicMode, setVols, startAmb, wolfHowl, playBossHowl, snd, unlock, musicAudio };
}
