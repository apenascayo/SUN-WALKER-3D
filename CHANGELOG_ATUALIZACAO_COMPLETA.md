# SUN WALKER 3D — Atualização completa

## Correções
- Tela preta no primeiro ataque: pernas dos inimigos não eram criadas (faltava `return` no mapeamento).
- Rolagem: o corpo girava em torno dos pés e afundava no chão; agora gira em torno do centro do corpo.
- Rolagem lateral: agora é uma cambalhota de lado (eixo frontal), com pernas recolhidas. A rolagem para a frente permanece igual.
- Nomes dos arquivos de música/efeitos no ZIP estavam corrompidos (ex.: "Sert├úo"); agora batem com o jogo ("Sertão").
- Chapéus: proporções revisadas (tamanho da aba, altura dos chifres do elmo, comprimento da capa de palha).

## Novidades
- Troca de arma animada (tecla R): guarda a arma atual no coldre/bainha do quadril e saca a outra. Espada fica na bainha à esquerda; arma de fogo no coldre à direita. Não é possível atacar durante a troca; rolar cancela a troca.
- Marcador vermelho: o primeiro golpe em um inimigo desenha um círculo fino vermelho no chão sob ele.
- Tecla I: abre/fecha o inventário (usar poção). O jogo pausa enquanto está aberto.
- Trilha das Chamas: golpe e brilho da espada em vermelho; inimigos não ficam mais atordoados; os que sobrevivem queimam por 3 s (3 ticks, 1 por segundo) com animação de chamas. Cada tick causa 25% do dano do golpe (constante `BURN_PCT` no código).
- Mercador: aba Roupas (5 chapéus e 7 cores de camisa; compra e equipar). Marcador do mercador no minimapa.
- Noite do lobisomem: o chefe continua igual; todos os outros inimigos da onda viraram lobisomens menores (tipo "W": modelo do chefe, escala 1,25 em vez de 2,3, 70 de vida em vez de 520, mais rápidos e com menos dano).

## Observações
- JavaScript validado com `node --check` e simulado sem navegador (ataques, rolagens, troca de arma, inventário, fogo, onda noturna). Não foi possível conferir o visual no navegador; ajustes de proporção dos chapéus e das poses podem ser necessários.

---

# Segunda atualização
- Música do lobisomem: ao começar a noite, a música atual para e toca "Vaqueiro Entoada" ou "Vaqueiro Entoada 2" (alternando, sem repetir em seguida). Essas duas faixas saíram da rotação normal e só tocam na fase do lobisomem. Ao amanhecer, volta a rotação normal.
- Máscaras no mercador (aba Roupas): Máscara Tengu (90 moedas) e Máscara Oni (110 moedas), modeladas a partir das fotos.
- Nível máximo (5) das trilhas: com a Trilha das Chamas, a espada e a arma de fogo ganham chamas animadas; com a Trilha do Raio, ganham raios animados em azul-ciano.
- Arqueiros viraram pistoleiros (o arqueiro comum ganhou chapéu; o esquelético mantém o crânio e o elmo). Disparam balas com o mesmo som do tiro da arma do jogador. A lógica de combate é a mesma, incluindo "Repelir projéteis".
