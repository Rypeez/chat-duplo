# Chat Duplo (Foundry VTT)

Divide o chat em **dois canais** (por padrão "Mesa 1" e "Mesa 2"). Funciona com o sistema **Tormenta20** e com qualquer outro sistema, porque atua sobre as mensagens de chat do Foundry, e não sobre a ficha.

## Recursos
- Abas no topo do chat: **Canal 1 / Canal 2 / Ambos**.
- Seletor (ícone de avião de papel) para escolher **onde suas mensagens e rolagens vão**: texto, rolagens da ficha T20, magias, ataques, macros etc.
- Contador de mensagens não lidas na aba do outro canal.
- Na aba "Ambos", cada mensagem tem uma etiqueta e uma borda colorida que mostram o canal dela.
- Clique direito numa mensagem → **Mover para ...**. O GM pode mover qualquer uma, e o jogador só as próprias.
- Nomes dos canais configuráveis pelo GM.
- Compatível com Foundry v12 e v13.

## Instalação
1. Copie a pasta `chat-duplo` para `{Dados do Foundry}/Data/modules/`.
2. Reinicie o Foundry, abra o mundo e ative **Chat Duplo** em *Gerenciar Módulos*.

## Macros
```js
const cd = game.modules.get("chat-duplo").api;
cd.setView("2");          // mostra o canal 2 ("1", "2" ou "all")
cd.setSendTo("1");        // passa a enviar no canal 1
cd.send("2", { content: "Mensagem direto no canal 2" });
```

## Observações
- O canal é gravado na mensagem no momento em que ela é criada, de acordo com a escolha de quem a enviou.
- Mensagens antigas, de antes da ativação do módulo, vão para o "Canal padrão" definido nas configurações.
- O Foundry carrega só as mensagens mais recentes. Se um canal tiver muito mais mensagens que o outro, role o chat para cima para carregar o histórico do canal mais vazio.
