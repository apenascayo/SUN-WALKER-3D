# Mapa de áudio — SUN WALKER 3D

## Música
As sete faixas são tocadas em playlist aleatória, uma por vez. Ao terminar uma faixa, a próxima começa; a lista é embaralhada novamente depois que todas tocarem. Não atribuí função narrativa fixa às músicas porque isso não pode ser confirmado apenas pelo nome do arquivo.

## Efeitos ligados a eventos
| Evento no protótipo | Arquivo |
|---|---|
| Ataque com espada | `sword.mp3` |
| Disparo do trabuco | `trabuco.mp3` |
| Troca de arma | `mudançaarma.mp3` |
| Guardar a espada ao equipar o trabuco | `bainha.mp3` |
| Esquiva/rolamento | `dash.mp3` |
| Jogador recebe dano | `somdor.mp3` |
| Inimigo recebe golpe / é derrotado | `hurtnpc.mp3` |
| Golpe de inimigo | `swordnpc.mp3` |
| Preparação de runa | `magic.mp3` |
| Descarga da runa | `danoeletrico.mp3` |
| Ganho de XP | `xp.mp3` |
| Subida de nível | `level.mp3` |
| Coleta de moeda | `coins.mp3` |
| Cura ao concluir onda | `cura.mp3` |
| Início de onda | `waveup.mp3` |
| Abrir inventário | `openbag.mp3` |

## Incluídos, mas ainda sem evento compatível
| Arquivo | Motivo |
|---|---|
| `merchant.mp3` | O protótipo atual não tem interação de comerciante. |
| `shield.mp3` | Não existe ação de bloquear/defender com escudo. |
| `arrow.mp3` | Não existe arco ou flecha no protótipo. |
| `balas.mp3` | Não há evento separado de munição; o disparo usa `trabuco.mp3`. |
| `bomba.mp3` | Não existe mecânica de bomba. |
| `nun-laugh.mp3` | Não há personagem/freira associado a esse som no protótipo atual. |
| `recharge-gun.wav` | O trabuco está com munição infinita e não possui recarga implementada. |
| `sowrdinimigo.mp3` | Nome sugere som de espada inimiga; mantido, mas o evento de golpe usa `swordnpc.mp3`. |

A associação dos efeitos foi feita com base nos nomes dos arquivos e nos eventos existentes no código. O ajuste final de volume, timbre e sincronismo deve ser conferido em playtest.
