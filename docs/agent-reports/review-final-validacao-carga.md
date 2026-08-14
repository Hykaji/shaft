# Revisão final da validação de carga

**Data:** 12 de agosto de 2026  
**Documento revisado:** `docs/agent-reports/resultado-validacao-carga-exercicios.md`  
**Revisão:** somente leitura; nenhum arquivo de implementação alterado  
**Parecer final:** **requer novos ajustes**

O parser de entrada do dashboard foi corrigido adequadamente: cargas vazias, arbitrárias, negativas, sem unidade, não finitas ou incompatíveis com incrementos de 0,5 fazem `getValidExercises` rejeitar a lista inteira. Portanto, essas cargas não habilitam a confirmação. Os formatos numéricos aceitos são coerentes com o campo `type="number"`, `min="0"` e `step="0.5"` do formulário.

O bloqueador restante está na edição do formulário, em `app/ShaftApp.tsx:219`. O handler ainda usa:

```ts
load: Number(event.target.value)
```

Ao apagar o campo, `event.target.value` é `""` e `Number("")` resulta em `0`. Estados textuais inválidos de um input numérico também podem ser expostos pelo navegador como valor vazio e seguir a mesma conversão. Assim, embora não exista mais fallback silencioso para cargas recebidas do dashboard, ainda existe conversão silenciosa para zero durante a edição feita pelo usuário.

`Peso corporal` foi reconhecido explicitamente e com segurança no parser, em `app/lib/dashboard-state.ts:94-107`; não é usado como fallback para texto desconhecido. Entretanto, sua semântica é perdida ao abrir o formulário: o item passa a exibir carga numérica `0`, indistinguível de um exercício realmente registrado como `0 kg`. Isso torna o tratamento intencional no parser, mas incompleto na interface de confirmação.

Os testes cobrem bem o parser e o validador compartilhados, incluindo inteiros, ponto e vírgula decimal, `Peso corporal`, zero, cargas vazias, texto arbitrário, unidade incorreta, sufixo extra, valores negativos/não finitos e incremento de 0,25. Os cinco testes passaram nesta revisão, assim como o lint direcionado. A cobertura, porém, não exercita o formulário nem verifica o que acontece ao apagar ou invalidar o campo, e também não verifica a preservação da semântica de `Peso corporal` dentro do sheet.

Por essas duas lacunas conectadas ao fluxo real de edição, o ajuste ainda não atende integralmente aos critérios solicitados.
