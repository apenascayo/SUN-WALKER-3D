# SUN WALKER 3D — Modularização do código

O CSS e o JavaScript que estavam concentrados no arquivo HTML foram separados em vários arquivos.

O HTML agora carrega `./js/main.js` e `./css/main.css` como pontos de entrada. Combate, números e o fluxo de jogo não mudaram.

## JavaScript
O estado compartilhado passa a ser criado por `createGame()` em `src/js/game.js`. Cada sistema recebe esse objeto em vez de importar o outro, para evitar ciclo entre jogador e combate.

### Arquivos
| Arquivo | Responsabilidade |
|---|---|
| `src/js/math.js` | `rnd`, `angDiff`, `lerpPose`, vetor temporário |
| `src/js/dom.js` | `$`, toast, banner, modal, feedback de HUD |
| `src/js/settings.js` | opções, teclas e `localStorage` de configuração |
| `src/js/save.js` | save/load, XP necessário, cosméticos persistidos |
| `src/js/audio.js` | playlist, SFX, ambiente, uivo e modo lobo |
| `src/js/vfx.js` | partículas e números de dano |
| `src/js/world.js` | renderer, terreno, props, colisão, mercador 3D |
| `src/js/player/visuals.js` | corpo, chapéus, armas, forma de lobo |
| `src/js/player/controller.js` | movimento, ataque, rolagem, tiro, troca de arma |
| `src/js/combat.js` | inimigos, projéteis, XP, queimadura, runas |
| `src/js/waves.js` | ondas, noite e chefes |
| `src/js/ui.js` | HUD, loja, árvore, inventário, menus |
| `src/js/game.js` | fábrica do objeto `game` e `update` |
| `src/js/main.js` | loop, intro, reset e ligação dos botões |

### Regras mantidas
- Three.js permanece global via CDN.
- Jogador e combate não se importam. Cruzamentos passam por `game` (`game.hitEnemy`, `game.hurtPlayer`, `game.spawn` via ondas).
- Chaves de `localStorage` inalteradas: `sw_settings`, `sw_cos`, `sw_skills`, `sw_save`.
- Comportamento de combate, mercador, habilidades, pausa e save copiado sem retuning.

## CSS
| Arquivo | Responsabilidade |
|---|---|
| `src/css/main.css` | ponto de entrada; só importa as outras folhas |
| `src/css/tokens.css` | variáveis (`--gold`, `--tx`, `--bg`) |
| `src/css/base.css` | `html`, `body`, canvas |
| `src/css/hud.css` | barras, pips, onda, chefe, botão de habilidades |
| `src/css/minimap.css` | mapa circular |
| `src/css/effects.css` | flash, toast, banners e animações |
| `src/css/overlays.css` | menu, pausa, morte, fade, skip |
| `src/css/modal.css` | loja, árvore, configurações |

`.hide` fica depois de `.ov` na cascata, para morte, pausa e modal continuarem ocultos quando as duas classes estão no mesmo elemento.

## Verificação
- Menu, intro, skip, onda 1, HUD e minimapa.
- Troca de arma (R), árvore de habilidades, pausa, morte/retry e loja do mercador.
- Estilos conferidos após o split: overlays `.ov.hide` com `display: none`, HUD invisível no menu, tokens dourados e modal de configurações.

## Observação
Os módulos ES e os `@import` de CSS exigem servir o jogo por HTTP. Abrir o HTML como `file://` não carrega os arquivos.
