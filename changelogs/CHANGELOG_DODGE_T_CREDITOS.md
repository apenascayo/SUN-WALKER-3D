# SUN WALKER 3D — Atualização: Dodge Roll, árvore e créditos

## Alterações
- A tecla **T** abre a árvore de habilidades e, quando ela já está aberta, fecha a mesma janela. O estado de pausa anterior é preservado.
- Créditos atualizados para identificar **Cayo R.** como criador e diretor.
- Esquiva padronizada sem sistema de peso ou carga de equipamento.
- Rolagem para trás usa a direção oposta à orientação do personagem quando não há direção pressionada.
- Janela de invulnerabilidade temporária e consumo/recuperação de stamina adicionados.
- Buffer curto permite encadear uma nova rolagem no fim da recuperação.
- Barra de stamina adicionada ao HUD.

## Parâmetros configuráveis
| Parâmetro | Valor | Descrição |
|---|---:|---|
| `duration` | 0,40 s | Duração total da rolagem |
| `startup` | 0,033 s | Preparação inicial |
| `iframes` | 0,216 s | Invulnerabilidade (aprox. 13 frames a 60 FPS) |
| `recovery` | 0,151 s | Recuperação final; soma com startup e iframes |
| `distance` | 3,6 unidades | Distância fixa |
| `staminaCost` | 25 | Custo por rolagem |
| `regenPerSecond` | 18 | Recuperação de stamina por segundo fora da rolagem |
| `bufferWindow` | 0,14 s | Janela para armazenar a próxima esquiva |
| `cooldown` | 0,08 s | Intervalo mínimo após iniciar uma rolagem |

A regra solicitada foi mantida: a esquiva pode começar se a stamina for maior que zero; o custo é descontado imediatamente e pode deixar o saldo negativo. Se estiver em zero ou abaixo no instante do comando, a esquiva não começa.

## Pseudocódigo estruturado
```text
CONSTANTES:
  DURACAO = 0.400
  STARTUP = 0.033
  IFRAMES = 0.216
  RECUPERACAO = 0.151
  DISTANCIA = 3.6
  CUSTO_STAMINA = 25
  JANELA_BUFFER = 0.140

AO_PRESSIONAR_ESQUIVA:
  se estado == ROLANDO:
    se tempo_rolando >= DURACAO - JANELA_BUFFER:
      esquiva_em_buffer = verdadeiro
    retornar

  se stamina <= 0 ou cooldown > 0 ou estado == MORTO:
    ignorar comando
    retornar

  stamina = stamina - CUSTO_STAMINA
  estado = ROLANDO
  tempo_rolando = 0
  invulneravel = verdadeiro
  direcao = direcao_de_movimento_ou_recuo

A_CADA_ATUALIZACAO(dt):
  se estado == ROLANDO:
    tempo_rolando += dt
    mover(DISTANCIA / DURACAO * dt, direcao)
    se tempo_rolando >= IFRAMES:
      invulneravel = falso
    se tempo_rolando >= DURACAO:
      estado = NORMAL
      invulneravel = falso
      se esquiva_em_buffer e stamina > 0:
        iniciar_nova_esquiva()
  senão:
    stamina = minimo(STAMINA_MAXIMA, stamina + REGENERACAO * dt)
```

## Verificações
- Sintaxe JavaScript validada com `node --check`.
- Integridade do ZIP validada após compactação.
- Não foi realizado teste interativo de partida em navegador nesta atualização.
