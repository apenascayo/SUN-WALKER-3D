# SUN WALKER 3D — Correções de esquiva, mercador, lobisomem e poções

## Alterações
- Rolagem frontal agora executa uma cambalhota completa com o corpo próximo ao chão, em vez de um salto para frente.
- Rolagem para trás preserva o pulinho solicitado.
- Ao iniciar uma onda noturna, o protagonista assume uma forma de lobisomem 3D estilizada, com focinho, orelhas, olhos brilhantes, patas e garras.
- Lobisomem tem deslocamento normal mais rápido e dash frontal mais longo/rápido.
- Ataques durante a forma de lobisomem usam animação de golpe com os dois braços/garras e efeito de corte avermelhado.
- Transição para a noite reproduz um uivo procedural de lobo via Web Audio, sem depender de arquivo externo.
- Tecla E abre o mercador quando o jogador está próximo e fecha a janela quando ela já está aberta.
- Comprar poção adiciona uma unidade ao inventário; usar pelo inventário consome uma unidade e recupera até 25 pontos de vida.
- Quantidade de poções é gravada no salvamento e restaurada ao continuar a partida.

## Observações
- O pacote recebido não continha uma imagem de referência separada do lobisomem; foi criado um modelo 3D low-poly original dentro da estética atual do jogo.
- O vídeo de referência foi identificado como “Dark Souls - Keep Rollin”; a rolagem frontal foi ajustada para uma rotação corporal contínua e baixa.
- JavaScript inline validado com `node --check`. Não foi possível executar teste interativo completo em navegador nesta sessão.
