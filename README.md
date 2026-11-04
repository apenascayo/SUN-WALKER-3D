# SUN WALKER 3D

Protótipo 3D de fantasia sombria no sertão pernambucano. O jogador sobrevive a ondas, troca entre espada e trabuco, visita o mercador e enfrenta o chefe lobisomem nas noites.

## Como jogar

O jogo usa módulos ES e `@import` de CSS, então precisa ser servido por HTTP. Abrir o HTML como `file://` não carrega os arquivos.

Também precisa de internet na primeira carga: Three.js e as fontes vêm de CDN.

Na pasta do projeto:

```bash
npx --yes serve src
```

Ou, com Python:

```bash
python -m http.server 8080 --directory src
```

Abra o endereço que o servidor mostrar (em geral `http://localhost:3000` ou `http://localhost:8080`). O ponto de entrada é `src/index.html`.

## Controles

| Ação | Tecla |
|---|---|
| Mover | WASD ou setas |
| Atacar / atirar | Clique esquerdo ou J |
| Rolar | Shift ou Espaço |
| Trocar arma | R |
| Falar com o mercador | E (perto dele) |
| Habilidades | T |
| Inventário | I |
| Pausa | ESC |
| Pular introdução | Enter |

Atacar, rolar e trocar arma podem ser reatribuídos em Configurações. Espaço continua rolando mesmo com outro atalho de esquiva.

## O que tem no protótipo

- Combate com combo de espada, trabuco de munição finita e rolagem com i-frames
- Ondas com ciclo de dia e noite; a cada 5 ondas vem a noite do lobisomem
- Mercador com poções, munição, ímã de coleta e cosméticos
- Árvore de habilidades, inventário, save local e configurações
- Playlist de música e efeitos no jogo

O progresso fica no `localStorage` do navegador (`sw_save`, `sw_skills`, `sw_cos`, `sw_settings`).

## Estrutura

```
src/
  index.html          casco da página
  css/                folhas por área da interface
  js/                 sistemas do jogo (ES modules)
  assets/audio/       músicas e efeitos
changelogs/           histórico das atualizações
instructions/         notas de áudio e mapeamento
```

`src/js/main.js` e `src/css/main.css` são os pontos de entrada. O HTML só carrega esses dois arquivos.

## Histórico

- [Modularização](changelogs/CHANGELOG_MODULARIZACAO.md)
- [Atualização completa](changelogs/CHANGELOG_ATUALIZACAO_COMPLETA.md)
- [Mapa de áudio](instructions/MAPA_AUDIO.md)
