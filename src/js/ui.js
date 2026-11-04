import { $, toast, showModal } from './dom.js';
import { S, KB, saveSet, resetSettings } from './settings.js';
import { save, saveSkills, readSave, need } from './save.js';
import { applyVideo, R } from './world.js';

const SETS = [['Vídeo', [['q', 'Qualidade gráfica', 's', ['Baixa', 'Média', 'Alta']], ['sh', 'Qualidade das sombras', 's', ['Desligadas', 'Baixa', 'Alta']], ['scale', 'Escala de resolução', 'r', .5, 1, .05], ['far', 'Distância de renderização', 'r', 40, 100, 5], ['fx', 'Efeitos visuais (partículas)', 'c'], ['fps', 'Limite de FPS', 's', ['Sem limite', '30', '60']], ['full', 'Tela cheia', 'f']]],
['Áudio', [['master', 'Volume geral', 'r', 0, 1, .05], ['music', 'Música', 'r', 0, 1, .05], ['sfx', 'Efeitos sonoros', 'r', 0, 1, .05], ['amb', 'Sons ambientes', 'r', 0, 1, .05], ['ui', 'Interface', 'r', 0, 1, .05]]],
['Controles', [['atk', 'Atacar / atirar', 'k'], ['dodge', 'Rolar (Espaço também funciona)', 'k'], ['weapon', 'Trocar arma', 'k']]],
['Gameplay', [['aim', 'Sensibilidade de mira', 'r', .4, 2, .1], ['dn', 'Números de dano', 'c'], ['shk', 'Tremor de tela (acessibilidade)', 'r', 0, 1, .1], ['vib', 'Vibração (se suportada)', 'c'], ['god', 'Modo Deus (vida, stamina e dinheiro infinitos)', 'c']]]];
const VID = ['q', 'sh', 'scale', 'far'];

export function closeModal(game) {
    game.listen = null; $('modal').classList.add('hide');
    if (game.invOpen) { game.invOpen = false; game.paused = game.invWasPaused }
    else if (game.skillTreeOpen) { game.skillTreeOpen = false; game.paused = game.skillTreeWasPaused }
    else if (game.mode === 'play') game.paused = game.merchantWasPaused
}

export function info(game, h, html) {
    const d = document.createElement('div'); d.innerHTML = '<h2>' + h + '</h2>' + html + '<p><button id="mcb">Voltar</button></p>'; showModal(d); $('mcb').onclick = () => closeModal(game)
}

export function openSkillTree(game) {
    const { pl, sheathVisual } = game;
    if ($('modal').classList.contains('hide')) game.skillTreeWasPaused = game.paused; game.skillTreeOpen = true; game.paused = true; const d = document.createElement('div'); const exp = pl.skills.explosive, lit = pl.skills.lightning, rep = pl.skills.repel, path = pl.skills.swordPath, points = pl.skills.points || 0, fs = pl.skills.fireStage || 0, ss = pl.skills.stormStage || 0, sheath = pl.skills.sheath; const fireLabel = path === 'storm' ? 'Bloqueada: trilha oposta' : fs >= 5 ? 'Trilha completa' : path === 'fire' ? 'Desbloquear etapa ' + (fs + 1) : 'Escolher trilha · etapa 1'; const stormLabel = path === 'fire' ? 'Bloqueada: trilha oposta' : ss >= 5 ? 'Trilha completa' : path === 'storm' ? 'Desbloquear etapa ' + (ss + 1) : 'Escolher trilha · etapa 1'; d.innerHTML = '<h2>Árvore de habilidades</h2><p>Ganhe 1 ponto de habilidade a cada nível. As trilhas elementais são exclusivas: escolha Fogo ou Relâmpago.</p><div class="row"><span>Pontos disponíveis</span><b>' + points + '</b></div><div class="skill-card"><div class="skill-tag" style="color:#ff8755">ESPADA · FOGO</div><h3>Trilha das Chamas</h3><p>5 etapas. Cada etapa aumenta o dano da espada em 8% e intensifica os efeitos de fogo.</p><div class="skill-tag">Etapas: ' + fs + '/5</div><p><button id="buyFire" ' + (points < 1 || path === 'storm' || fs >= 5 ? 'disabled' : '') + '>' + fireLabel + '</button></p></div><div class="skill-card"><div class="skill-tag" style="color:#65dfff">ESPADA · RELÂMPAGO</div><h3>Trilha Elétrica</h3><p>5 etapas. Cada etapa aumenta o dano da espada em 8% e adiciona energia elétrica aos golpes.</p><div class="skill-tag">Etapas: ' + ss + '/5</div><p><button id="buyStorm" ' + (points < 1 || path === 'fire' || ss >= 5 ? 'disabled' : '') + '>' + stormLabel + '</button></p></div><div class="skill-card"><div class="skill-tag" style="color:#c99a5a">VISUAL · BAINHA</div><h3>Bainha do Vaqueiro</h3><p>Desbloqueia uma bainha visível na cintura. Efeito apenas visual, sem bônus de dano.</p><p><button id="buySheath" ' + (sheath || points < 1 ? 'disabled' : '') + '>' + (sheath ? 'Desbloqueada' : 'Desbloquear · 1 ponto') + '</button></p></div><div class="skill-card"><div class="skill-tag">TRABUCO · HABILIDADE</div><h3>Bala Explosiva</h3><p>35% de chance de explodir no impacto. Elimina instantaneamente os inimigos próximos da explosão.</p><b>1 ponto de habilidade</b><p><button id="buyExplosive" ' + (exp || points < 1 ? 'disabled' : '') + '>' + (exp ? 'Desbloqueada' : points >= 1 ? 'Desbloquear' : 'Pontos insuficientes') + '</button></p></div><div class="skill-card"><div class="skill-tag">ESPADA · HABILIDADE</div><h3>Corte Relâmpago</h3><p>No terceiro golpe do combo, avança em linha reta e corta todos os inimigos no caminho. Sobreviventes ficam paralisados por 4 segundos.</p><b>1 ponto de habilidade</b><p><button id="buyLightning" ' + (lit || points < 1 ? 'disabled' : '') + '>' + (lit ? 'Desbloqueada' : points >= 1 ? 'Desbloquear' : 'Pontos insuficientes') + '</button></p></div><div class="skill-card"><div class="skill-tag">DEFESA · HABILIDADE</div><h3>Repelir projéteis</h3><p>Quando uma bala se aproxima, o tempo desacelera. Golpeie-a com a espada para rebater em direção aos inimigos.</p><b>1 ponto de habilidade</b><p><button id="buyRepel" ' + (rep || points < 1 ? 'disabled' : '') + '>' + (rep ? 'Desbloqueada' : points >= 1 ? 'Desbloquear' : 'Pontos insuficientes') + '</button></p></div><div class="row"><span>Saldo</span><b>' + pl.coins + ' moedas</b></div><p><button id="closeSkills">Voltar</button></p>'; showModal(d); $('buyFire').onclick = () => { if (points > 0 && path !== 'storm' && fs < 5) { pl.skills.swordPath = 'fire'; pl.skills.fireStage = fs + 1; pl.skills.points = points - 1; saveSkills(game); openSkillTree(game) } }; $('buyStorm').onclick = () => { if (points > 0 && path !== 'fire' && ss < 5) { pl.skills.swordPath = 'storm'; pl.skills.stormStage = ss + 1; pl.skills.points = points - 1; saveSkills(game); openSkillTree(game) } }; $('buySheath').onclick = () => { if (!sheath && points > 0) { pl.skills.sheath = true; pl.skills.points = points - 1; sheathVisual.visible = true; saveSkills(game); openSkillTree(game) } }; $('buyExplosive').onclick = () => { if (!pl.skills.explosive && pl.skills.points > 0) { pl.skills.points--; pl.skills.explosive = true; saveSkills(game); game.playSfx('coins'); toast('Bala Explosiva desbloqueada'); openSkillTree(game) } }; $('buyLightning').onclick = () => { if (!pl.skills.lightning && pl.skills.points > 0) { pl.skills.points--; pl.skills.lightning = true; saveSkills(game); game.playSfx('danoeletrico'); toast('Corte Relâmpago desbloqueado'); openSkillTree(game) } }; $('buyRepel').onclick = () => { if (!pl.skills.repel && pl.skills.points > 0) { pl.skills.points--; pl.skills.repel = true; saveSkills(game); toast('Repelir projéteis desbloqueado'); openSkillTree(game) } }; $('closeSkills').onclick = () => { closeModal(game); game.paused = game.skillTreeWasPaused }
}

export function openMerchant(game, tab) {
    const { pl, HATS, SHIRTS, COS, S } = game;
    tab = tab || 'loja'; if ($('modal').classList.contains('hide')) game.merchantWasPaused = game.paused; game.paused = true; const d = document.createElement('div');
    let h = '<h2>Mercador do Sertão</h2><div class="shop-tabs"><button id="tabS" class="' + (tab === 'loja' ? 'on' : '') + '">Suprimentos</button><button id="tabR" class="' + (tab === 'roupas' ? 'on' : '') + '">Roupas</button></div>';
    if (tab === 'loja') { const ml = pl.magnetLevel || 0, magPrices = [0, 35, 80, 160]; h += '<p>Suprimentos para continuar a caçada.</p><div class="skill-card"><h3>Ímã de coleta · nível ' + ml + '/3</h3><p>' + (ml === 0 ? 'Atrai moedas em um raio de 4,5 m.' : ml === 1 ? 'Aumenta o raio de coleta para 7,5 m.' : ml === 2 ? 'Aumenta o raio de coleta para 12 m.' : 'Nível máximo: coleta magnética aprimorada.') + '</p><b>' + (ml < 3 ? magPrices[ml + 1] + ' moedas' : 'Totalmente aprimorado') + '</b><p><button id="buyMagnet" ' + (ml >= 3 || pl.coins < magPrices[ml + 1] ? 'disabled' : '') + '>' + (ml >= 3 ? 'Nível máximo' : 'Comprar nível ' + (ml + 1)) + '</button></p></div><div class="skill-card"><h3>Poção de cura</h3><p>Recupera 25 pontos de vida quando usada. No estoque: ' + (pl.potions || 0) + '</p><b>8 moedas</b><p><button id="buyPotion" ' + (pl.coins < 8 ? 'disabled' : '') + '>Comprar poção</button></p></div><div class="skill-card"><h3>Caixa de balas</h3><p>Adiciona 30 munições ao trabuco.</p><b>20 moedas</b><p><button id="buyAmmo" ' + (pl.coins < 20 ? 'disabled' : '') + '>Comprar munição</button></p></div>' }
    else {
        h += '<p>Troque o chapéu e a cor da camisa.</p><h3>Chapéus</h3>'; for (const id in HATS) { const H = HATS[id], own = COS.hats.includes(id), cur = COS.hat === id; h += '<div class="skill-card"><h3>' + H.n + '</h3><b>' + (own ? 'Comprado' : H.p + ' moedas') + '</b><p><button data-hat="' + id + '" ' + (cur || (!own && pl.coins < H.p) ? 'disabled' : '') + '>' + (cur ? 'Em uso' : own ? 'Usar' : 'Comprar') + '</button></p></div>' }
        h += '<h3>Camisa</h3><div class="swatches">'; SHIRTS.forEach((shirt, n) => { const own = COS.shirts.includes(shirt.c), cur = COS.shirt === shirt.c; h += '<button data-shirt="' + n + '" ' + (cur || (!own && pl.coins < shirt.p) ? 'disabled' : '') + '><i style="background:#' + shirt.c.toString(16).padStart(6, '0') + '"></i>' + shirt.n + '<small>' + (cur ? 'Em uso' : own ? 'Usar' : shirt.p + ' moedas') + '</small></button>' }); h += '</div>'
    }
    h += '<div class="row"><span>Saldo</span><b>' + pl.coins + ' moedas</b></div><p><button id="closeShop">Sair</button></p>'; d.innerHTML = h; showModal(d);
    $('tabS').onclick = () => openMerchant(game, 'loja'); $('tabR').onclick = () => openMerchant(game, 'roupas'); $('closeShop').onclick = () => { closeModal(game); game.paused = game.merchantWasPaused };
    if (tab === 'loja') { $('buyMagnet').onclick = () => { const lv = pl.magnetLevel || 0, prices = [0, 35, 80, 160]; if (lv < 3 && pl.coins >= prices[lv + 1]) { if (!pl.god && !S.god) pl.coins -= prices[lv + 1]; pl.magnetLevel = lv + 1; game.playSfx('coins'); toast('Ímã aprimorado para nível ' + pl.magnetLevel); save(game); openMerchant(game, 'loja') } }; $('buyPotion').onclick = () => { if (pl.coins >= 8) { if (!pl.god && !S.god) pl.coins -= 8; pl.potions = (pl.potions || 0) + 1; game.playSfx('coins'); toast('Poção adicionada ao inventário'); save(game); openMerchant(game, 'loja') } }; $('buyAmmo').onclick = () => { if (pl.coins >= 20) { if (!pl.god && !S.god) pl.coins -= 20; pl.ammo += 30; game.playSfx('balas'); game.playSfx('coins'); toast('+30 balas'); save(game); openMerchant(game, 'loja') } } }
    else {
        d.querySelectorAll('[data-hat]').forEach(b => b.onclick = () => { const id = b.dataset.hat, H = HATS[id]; if (!COS.hats.includes(id)) { if (pl.coins < H.p) return; if (!pl.god && !S.god) pl.coins -= H.p; COS.hats.push(id); game.playSfx('coins') } game.setHat(id); game.saveCos(); save(game); toast(H.n + ' equipado'); openMerchant(game, 'roupas') });
        d.querySelectorAll('[data-shirt]').forEach(b => b.onclick = () => { const shirt = SHIRTS[+b.dataset.shirt]; if (!COS.shirts.includes(shirt.c)) { if (pl.coins < shirt.p) return; if (!pl.god && !S.god) pl.coins -= shirt.p; COS.shirts.push(shirt.c); game.playSfx('coins') } game.setShirt(shirt.c); game.saveCos(); save(game); toast('Camisa ' + shirt.n.toLowerCase() + ' equipada'); openMerchant(game, 'roupas') })
    }
}

export function toggleInv(game) {
    const m = $('modal').classList.contains('hide'); if (game.invOpen) { closeModal(game); return } if (!m || game.paused) return; game.invWasPaused = game.paused; game.invOpen = true; game.paused = true; $('pI').onclick()
}

export function openInventory(game) {
    const { pl, waves } = game;
    game.playSfx('openbag');
    info(game, 'Inventário', '<div class="row"><span>Poções de cura</span><b>' + (pl.potions || 0) + '</b></div><p><button id="usePotion" ' + ((pl.potions || 0) <= 0 || pl.hp >= pl.max ? 'disabled' : '') + '>Usar poção (+25 vida)</button></p><div class="row"><span>Nível</span><b>' + pl.lv + '</b></div><div class="row"><span>Experiência</span><b>' + pl.xp + ' / ' + need(pl.lv) + '</b></div><div class="row"><span>Vida</span><b>' + Math.ceil(pl.hp) + ' / ' + pl.max + '</b></div><div class="row"><span>Moedas</span><b>' + pl.coins + '</b></div><div class="row"><span>Espada</span><b>' + (pl.weapon ? 'guardada' : 'equipada') + '</b></div><div class="row"><span>Trabuco</span><b>' + (pl.weapon ? 'equipado' : 'guardado') + ' · balas 30</b></div><div class="row"><span>Onda atual</span><b>' + Math.max(1, waves.n) + '</b></div>');
    const use = $('usePotion'); if (use) use.onclick = () => { if ((pl.potions || 0) > 0 && pl.hp < pl.max) { pl.potions--; pl.hp = Math.min(pl.max, pl.hp + 25); game.playSfx('cura'); toast('+25 de vida'); save(game); $('pI').click() } }
}

function setv(game, k, v) {
    const { pl, audio } = game;
    if (VID.includes(k)) { if (!game.pend) game.pend = { q: S.q, sh: S.sh, scale: S.scale, far: S.far }; S[k] = v; applyVideo(game); $('keep').classList.remove('hide'); let n = 10; $('kt').textContent = n; clearInterval(game.kt); game.kt = setInterval(() => { $('kt').textContent = --n; if (n <= 0) revert(game) }, 1000) }
    else { S[k] = v; if (k === 'god') { pl.god = !!v; if (pl.god) { pl.hp = pl.max; pl.stamina = pl.staminaMax; pl.coins = 999999; toast('Modo Deus ativado') } else toast('Modo Deus desativado') } saveSet(); audio.setVols() }
}

export function keepV(game) { clearInterval(game.kt); game.pend = null; $('keep').classList.add('hide'); saveSet() }

export function revert(game) { clearInterval(game.kt); if (game.pend) Object.assign(S, game.pend); game.pend = null; $('keep').classList.add('hide'); applyVideo(game); if (!$('modal').classList.contains('hide')) openSettings(game) }

function bindKey(game, k, e) { e.preventDefault(); if (k !== 'escape') { KB[game.listen] = k; saveSet() } game.listen = null; openSettings(game) }

export function openSettings(game) {
    const mc = document.createElement('div'); mc.innerHTML = '<h2>Configurações</h2>';
    for (const sec of SETS) {
        const t = document.createElement('h3'); t.textContent = sec[0]; mc.appendChild(t);
        for (const [k, l, ty, a, b, st] of sec[1]) {
            const r = document.createElement('div'); r.className = 'row'; r.innerHTML = '<label>' + l + '</label>'; let c;
            if (ty === 's') { c = document.createElement('select'); a.forEach((o, i) => c.add(new Option(o, i))); c.value = S[k]; c.onchange = () => setv(game, k, +c.value) }
            else if (ty === 'r') { c = document.createElement('input'); c.type = 'range'; Object.assign(c, { min: a, max: b, step: st, value: S[k] }); c.oninput = () => setv(game, k, +c.value) }
            else if (ty === 'c') { c = document.createElement('input'); c.type = 'checkbox'; c.checked = S[k]; c.onchange = () => setv(game, k, c.checked) }
            else if (ty === 'f') { c = document.createElement('button'); c.textContent = 'Alternar'; c.onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen() } catch (e) { } } }
            else { c = document.createElement('button'); c.textContent = KB[k].toUpperCase(); c.onclick = () => { game.listen = k; c.textContent = 'pressione uma tecla…' } }
            r.appendChild(c); mc.appendChild(r)
        }
    }
    const f = document.createElement('div'), b1 = document.createElement('button'), b2 = document.createElement('button'); f.className = 'row'; b1.textContent = 'Restaurar padrões'; b1.onclick = () => { resetSettings(); game.pend = null; $('keep').classList.add('hide'); saveSet(); applyVideo(game); game.audio.setVols(); openSettings(game) }; b2.textContent = 'Voltar'; b2.onclick = () => closeModal(game); f.append(b1, b2); mc.appendChild(f); showModal(mc)
}

function HUDX(game) {
    const { waves, enemies, pl } = game;
    $('wn2').textContent = 'Onda ' + Math.max(1, waves.n); $('wr').textContent = waves.st === 'active' ? waves.left() + ' inimigos restantes' : waves.st === 'rest' ? 'Próxima onda em ' + Math.ceil(waves.t) + 's' : '';
    const bs = enemies.find(e => e.boss && !e.dead); $('boss').style.display = bs ? 'block' : 'none'; if (bs) { $('bhp').style.width = bs.hp / bs.max * 100 + '%'; $('bname').textContent = game.bossName() }
    $('hp').parentNode.classList.toggle('low', pl.hp / pl.max < .3)
}

export function drawMinimap(game) {
    if (game.mode !== 'play') return;
    const { mapCtx, mapCanvas, enemies, pl } = game;
    const c = mapCtx, w = mapCanvas.width, h = mapCanvas.height, cx = w / 2, cy = h / 2, r = 155, scale = r / (R - 3); c.clearRect(0, 0, w, h); c.save(); c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip(); c.fillStyle = 'rgba(27,22,16,.92)'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(226,174,94,.2)'; c.lineWidth = 1; for (let q = 1; q <= 3; q++) { c.beginPath(); c.arc(cx, cy, r * q / 3, 0, Math.PI * 2); c.stroke() } c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.moveTo(cx, cy - r); c.lineTo(cx, cy + r); c.stroke();
    const pt = (x, z) => [cx + x * scale, cy + z * scale]; for (const e of enemies) { if (e.dead || e.clone) continue; const [x, y] = pt(e.x, e.z); c.fillStyle = e.boss ? '#ffb23f' : '#e85a48'; c.beginPath(); c.arc(x, y, e.boss ? 7 : 4.5, 0, Math.PI * 2); c.fill(); }
    { const [mx, my] = pt(-7, 6); c.fillStyle = '#2fd2c0'; c.strokeStyle = '#10231f'; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, my - 10); c.lineTo(mx + 9, my); c.lineTo(mx, my + 10); c.lineTo(mx - 9, my); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#10231f'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', mx, my + 1) }
    const [px, py] = pt(pl.x, pl.z); c.save(); c.translate(px, py); c.rotate(-pl.face); c.fillStyle = '#ffe08a'; c.strokeStyle = '#3b2111'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -11); c.lineTo(7, 8); c.lineTo(0, 5); c.lineTo(-7, 8); c.closePath(); c.fill(); c.stroke(); c.restore(); c.restore(); c.strokeStyle = 'rgba(232,178,58,.9)'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
}

export function hud(game, dt) {
    const { pl, dns, cam } = game;
    HUDX(game); drawMinimap(game); $('wn').textContent = pl.weapon ? 'Trabuco' : 'Espada'; $('pips').style.display = pl.weapon ? 'none' : 'inline-flex'; $('am').style.display = pl.weapon ? 'inline' : 'none'; $('am').textContent = ' · balas ' + pl.ammo; $('hp').style.width = pl.hp / pl.max * 100 + '%'; $('hpt').textContent = Math.ceil(pl.hp) + ' / ' + pl.max; $('xp').style.width = pl.xp / need(pl.lv) * 100 + '%'; $('lv').textContent = pl.lv; $('coins').textContent = pl.coins + ' moedas'; $('dg').style.width = (1 - pl.dcd / .9) * 100 + '%'; $('stamina').style.width = (pl.stamina / pl.staminaMax * 100) + '%';
    if (pl.state !== 'attack' && pl.t - pl.lastEnd > .5) [...$('pips').children].forEach(u => u.classList.remove('on'));
    for (let i = dns.length - 1; i >= 0; i--) { const n = dns[i]; n.t += dt; n.p.y += dt * 1.2; const v = n.p.clone().project(cam); n.el.style.left = (v.x * .5 + .5) * innerWidth + 'px'; n.el.style.top = (-v.y * .5 + .5) * innerHeight + 'px'; n.el.style.opacity = 1 - n.t / .8; if (n.t > .8) { n.el.remove(); dns.splice(i, 1) } }
}

export const refreshMenu = () => { $('mCont').disabled = !readSave() };

export function escKey(game) {
    if (!$('modal').classList.contains('hide')) { closeModal(game); return }
    if (game.mode === 'intro') { game.skipIntro(); return }
    if (game.mode === 'play' && game.pl.state !== 'dead') { game.paused = !game.paused; $('pause').classList.toggle('hide', !game.paused) }
}

export function bindUI(game) {
    $('skillBtn').onclick = () => openSkillTree(game);
    $('mNew').onclick = () => game.startGame(false);
    $('mCont').onclick = () => game.startGame(true);
    $('mSet').onclick = () => openSettings(game);
    $('mCred').onclick = () => info(game, 'Créditos', '<p><b>SUN WALKER</b> — protótipo 3D</p><p>Criador e diretor: <b>Cayo R.</b></p><p>Conceito e design: equipe SUN WALKER.</p><p>Programação e arte 3D procedural: Claude (Anthropic), com Three.js.</p><p>Inspirado no folclore e no sertão de Pernambuco.</p>');
    $('mExit').onclick = () => { try { window.close() } catch (e) { } info(game, 'Até logo!', '<p>O navegador não permite que a página se feche sozinha. Você já pode fechar esta aba.</p>') };
    $('pC').onclick = () => { game.paused = false; $('pause').classList.add('hide') };
    $('pSkills').onclick = () => openSkillTree(game);
    $('pS').onclick = () => openSettings(game);
    $('pM').onclick = () => game.toMenu();
    $('pI').onclick = () => openInventory(game);
    $('again').onclick = () => game.retryCurrentWave();
    $('dmenu').onclick = () => game.toMenu();
    $('skip').onclick = () => game.skipIntro();
    $('kY').onclick = () => keepV(game);
    $('kN').onclick = () => revert(game);
}

export function bindInput(game) {
    addEventListener('blur', () => game.clearInputs());
    document.addEventListener('visibilitychange', () => { if (document.hidden) game.clearInputs() });
    addEventListener('keydown', e => {
        const k = e.key.toLowerCase(); game.keys[k] = 1;
        if (k === 'escape') { escKey(game); return }
        if (k === 't' && game.mode === 'play' && !e.repeat) { e.preventDefault(); if (game.skillTreeOpen) { closeModal(game) } else if ($('modal').classList.contains('hide')) { openSkillTree(game) } return }
        if (k === 'i' && game.mode === 'play' && !e.repeat && game.pl.state !== 'dead') { e.preventDefault(); toggleInv(game); return }
        if (game.listen) { bindKey(game, k, e); return }
        if (game.mode === 'intro' && (k === 'enter' || k === ' ')) { game.skipIntro(); return }
        if (k === KB.atk && game.mode === 'play' && !game.paused) game.pl.buf = .28;
        if (k === KB.weapon && !e.repeat && game.running && !game.paused && (game.pl.state === 'idle' || game.pl.state === 'move')) game.startSwap(1 - game.pl.weapon);
        if (k === KB.dodge || k === ' ') { if (game.mode === 'play' && !game.paused) { game.want.dodge = true; e.preventDefault() } }
    });
    addEventListener('keyup', e => { delete game.keys[e.key.toLowerCase()] });
    addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'e' && game.mode === 'play' && !e.repeat) {
            if (!$('modal').classList.contains('hide')) { if ($('mc').querySelector('#closeShop')) { e.preventDefault(); closeModal(game); game.paused = game.merchantWasPaused } return }
            if (!game.paused && Math.hypot(game.pl.x + 7, game.pl.z - 6) < 3.2) { e.preventDefault(); openMerchant(game) }
        }
    });
    addEventListener('mousemove', e => { game.mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1) });
    $('c').addEventListener('mousedown', e => { if (e.button === 0 && game.mode === 'play' && !game.paused) game.pl.buf = .28 });
    addEventListener('pointerdown', () => game.audio.unlock(), { once: true });
    document.addEventListener('click', e => { if (e.target.closest('button')) game.audio.snd(520, .07, 'triangle', .05, 740, 'ui') });
}
