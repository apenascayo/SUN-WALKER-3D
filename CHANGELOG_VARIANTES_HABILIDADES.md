# SUN WALKER 3D — Atualização de combate e inimigos

## Alterações desta entrega
- Ao morrer, a opção principal repete a onda atual sem apagar nível, moedas, munição ou habilidades adquiridas.
- Rolagem voltou ao movimento compacto anterior; sem cambalhota completa. Sem direção ou com S, o deslocamento é para trás em relação à orientação do personagem.
- Bala Explosiva, Corte Relâmpago e Repelir Projéteis agora consomem 1 ponto de habilidade cada, não moedas.
- Repelir Projéteis desacelera o tempo quando uma flecha se aproxima. Durante um ataque de espada, o projétil pode ser rebatido contra o inimigo mais próximo.
- A conversa com o mercador pausa a simulação e retoma ao fechar a loja.
- Três variantes procedurais foram adicionadas às ondas: Fera de Orelhas (rápida), Carcaça Abissal (tanque com espinhos e mandíbula) e Sentinela Ossuda (arqueiro esquelético).
- Arqueiros esqueléticos compartilham a lógica de ataque à distância e aparecem em ondas posteriores.

## Limitações e testes
- Os novos inimigos são modelos procedurais construídos com geometria Three.js, inspirados nas silhuetas enviadas e adaptados à paleta do jogo; não são cópias dos modelos das imagens.
- JavaScript validado com `node --check` e ZIP validado com `unzip -t`.
- Não foi possível confirmar uma partida interativa em navegador nesta execução; recomenda-se testar especialmente o parry de flechas, a repetição de onda e a pausa da loja.
- Nenhum commit ou push foi realizado.
