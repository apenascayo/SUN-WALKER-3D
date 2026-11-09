# SUN WALKER 3D

Protótipo 3D de fantasia sombria no sertão pernambucano. O jogador sobrevive a ondas, troca entre espada e trabuco, visita o mercador e enfrenta o chefe lobisomem nas noites.

## Como jogar

O jogo usa módulos ES e `@import` de CSS, então precisa ser servido por HTTP. Abrir o HTML como `file://` não carrega os arquivos.

Também precisa de internet na primeira carga: Three.js e as fontes vêm de CDN.

Abrir com Live-Server ja é o bastante, mas também pode-se usar as seguintes opções:

Na pasta do projeto: 

```bash
npx --yes serve src
```

No PowerShell do Windows, se a execução de scripts estiver bloqueada, use `npx.cmd --yes serve src`.

Ou, com Python:

```bash
python -m http.server 8080 --directory src
```

Abra o endereço que o servidor mostrar (em geral `http://localhost:3000` ou `http://localhost:8080`). O ponto de entrada é `src/index.html`.

## Controles

| Ação | Tecla |
|---|---|
| Mover | WASD ou setas |
| Mirar | Mouse |
| Atacar / atirar | Clique esquerdo ou J |
| Rolar | Shift ou Espaço (sem a Foice-Marreta) |
| Foice-Marreta: ir até o inimigo fisgado | Shift + W |
| Foice-Marreta: puxar o inimigo fisgado | Shift + S |
| Foice-Marreta: giro defensivo e deflexão | Shift + Espaço |
| Foice-Marreta: lançar / recolher | Q |
| Trocar arma | R |
| Falar com o mercador | E (perto dele) |
| Habilidades | T |
| Inventário | I |
| Pausa | ESC |
| Pular introdução | Enter |

Atacar, rolar e trocar arma podem ser reatribuídos em Configurações. Espaço continua rolando mesmo com outro atalho de esquiva.

A foice é lançada na direção do mouse. Se atingir um inimigo, ela permanece presa com uma corda ligando-o ao jogador. Só enquanto estiver presa é possível usar Shift + W para ir até esse inimigo ou Shift + S para puxá-lo; as duas ações terminam com um salto, giro e golpe de marreta. Pressione Q novamente para recolhê-la sem usar essas ações. Se não atingir ninguém, ela retorna automaticamente. Enquanto a foice estiver fora, o jogador ainda pode se mover, mas não atacar com ela. Com a Foice-Marreta equipada, Q tem prioridade sobre qualquer outro controle configurado nessa tecla.

O combo normal da Foice-Marreta tem três golpes: foice, foice e uma marretada de cima para baixo com impacto no chão. No ataque especial após puxar ou avançar até um inimigo fisgado, o personagem salta e gira antes de acertar a marreta, com impacto, estrondo e hitstop. A atualização também corrige a interrupção do jogo durante ataques.

Com as duas espadas equipadas, o jogador corre a 1,5 vez a velocidade básica e pode se mover durante os golpes cruzados em X, atingindo inimigos dos dois lados. Em repouso, as duas lâminas ficam voltadas para baixo. Ao esquivar para a frente, ou sem pressionar uma direção, com um inimigo próximo à frente, ele salta por cima e o corta; o hitstop desse corte acontece aleatoriamente. Os caminhos de fogo e relâmpago criam efeitos nos pés quando as espadas estão equipadas.

O trabuco custa 75 moedas no mercador e vem com 30 balas. Partidas salvas de versões anteriores mantêm o trabuco. Caixas de balas compradas ficam na bolsa e podem ser usadas para adicionar 30 balas. Abra a bolsa com I ou pelo menu de pausa; clique nos itens para usar ou equipar. As armas não aparecem na bolsa: use R para trocá-las.

O HUD identifica a arma equipada, o caminho elemental escolhido e o nível do ímã. A bolsa usa uma grade de espaços com ícones próprios para os itens, chapéus e máscaras adquiridos; nela é possível usar poções e caixas de balas ou equipar cosméticos.

## O que tem no protótipo

- Combate com combo de espada, trabuco de munição finita, rolagem com i-frames e Foice-Marreta híbrida (dois golpes de foice de 25, marreta de 70, investida especial de 150)
- Ondas com ciclo de dia e noite; a cada 5 ondas vem a noite do lobisomem
- Mercador com trabuco (75 moedas), poções, munição, ímã de coleta, cosméticos e Foice-Marreta (300 moedas)
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

## Testes

Com Node.js instalado, execute `node --test tests/combat.test.mjs` para verificar as mecânicas de combate.

## Histórico

- [Modularização](changelogs/CHANGELOG_MODULARIZACAO.md)
- [Atualização completa](changelogs/CHANGELOG_ATUALIZACAO_COMPLETA.md)
- [Mapa de áudio](instructions/MAPA_AUDIO.md)
