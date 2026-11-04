# SUN WALKER 3D — Atualização de movimentação, ondas e mercador

## Movimentação e armas
- Rolagem com deslocamento real na direção escolhida; sem direção ou segurando S/baixo, executa rolagem para trás em relação à orientação do personagem.
- Animação da rolagem mais longa e pesada: agachamento, projeção do ombro, recolhimento das pernas, rotação e recuperação da postura.
- Trabuco com pose de apoio das duas mãos e animação de recuo.
- Munição finita: novo jogo começa com 30 balas; cada disparo consome uma. Sem munição, o tiro é bloqueado.

## Ciclo de ondas
- A cada 5 ondas, transição gradual para a noite.
- Durante a onda noturna: inimigos com +30% de vida/dano, +10% de velocidade e +15% de quantidade.
- Ao concluir a onda noturna, a iluminação e o céu fazem transição gradual de volta ao dia.
- Arqueiros adicionados ao plano de ondas a partir da onda 3; há pelo menos um arqueiro nessas ondas. Eles mantêm distância e disparam flechas.

## Mercador
- NPC mercador colocado no mapa nas coordenadas aproximadas (-7, 6).
- Ao se aproximar, aparece a indicação para apertar E.
- Poção: 8 moedas, recupera até 25 pontos de vida.
- Caixa de balas: 20 moedas, adiciona 30 munições.
- Saldo e munição são salvos após a compra.

## Verificação
- JavaScript validado com `node --check`.
- O teste visual/interativo completo no navegador ainda precisa ser feito no computador do jogador.
