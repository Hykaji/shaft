# Emenda da Direção: atualização pontual do package-lock

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Classificação:** Nível 3 - crítico

**Decisão:** Edição pontual do campo raiz do `package-lock.json` autorizada

## Contexto

Ao tentar sincronizar o requisito de Node com npm `10.9.3`, o Builder observou
churn adicional: o npm removeu metadados `libc` de pacotes opcionais. Isso
ultrapassava a autorização anterior, que permitia somente a mudança de
`engines.node` do pacote raiz. O Builder reverteu integralmente as quatro
mudanças técnicas e não deixou implementação parcial.

O usuário então declarou explicitamente: “Autorizo a edição pontual do campo
raiz do package-lock.json e a continuação da correção”.

## Emenda autorizada

Na implementação já aprovada em
[`07-direction-node-compatibility-approval.md`](07-direction-node-compatibility-approval.md),
o Builder deve:

- alterar `package.json` para `engines.node: ">=22.18.0"`;
- editar manualmente somente `packages[""].engines.node` no
  `package-lock.json`, de `">=22.13.0"` para `">=22.18.0"`;
- não regenerar o lockfile com `npm install` ou comando equivalente;
- executar `npm ci --no-audit --no-fund` depois da edição como prova de
  coerência entre manifesto e lockfile;
- exigir que nenhuma outra linha, versão, integridade ou metadado do lockfile
  seja alterado.

As demais mudanças e validações autorizadas permanecem exatamente como
registradas nos documentos 06 e 07.

## Runtime temporário

O runtime oficial Node `v22.18.0` já verificado em
`C:\Users\taran\AppData\Local\Temp\shaft-node-22.18-validation-2d0549bfff0042c8ab3642c914fca3a0`
pode ser reutilizado exclusivamente para as validações previstas. Ele não deve
ser removido, substituído nem instalado globalmente nesta etapa. Sua limpeza
será uma ação posterior e separada.

## Limites preservados

Esta emenda não autoriza dependências, scripts, código, testes, `pnpm-lock`,
commit, push, rerun, novo PR, merge, configuração remota, deploy ou acesso a
dados e serviços do produto. Qualquer novo desvio deve interromper novamente a
implementação e retornar à Direção.
