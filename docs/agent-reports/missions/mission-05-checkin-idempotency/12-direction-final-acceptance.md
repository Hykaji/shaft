# Direção: aceitação final da Missão 5

**Data:** 15 de agosto de 2026  
**Missão:** `mission-05-checkin-idempotency`  
**Decisão:** Aceita no escopo local

## Base da decisão

A Direção aceita a implementação local após:

- entrega inicial registrada no relatório 08;
- revisão independente com achado bloqueante registrada no relatório 09;
- correção estreita do Builder registrada no relatório 10;
- reavaliação final registrada no relatório 11 com veredito
  `Approved with non-blocking observations`;
- build, lint e suíte completa com 43 testes aprovados.

O bloqueador de tratamento incorreto das falhas Notion no dashboard D1 foi
resolvido. Falhas do ledger permanecem isoladas, enquanto falhas das consultas
Notion preservam o tratamento sanitizado aprovado na Missão 4.

## Escopo aceito

- ledger D1 local canônico para check-ins e XP quando o modo `d1` estiver
  explicitamente ativado;
- unicidade por owner e data, replay idempotente, conflito seguro e XP derivado
  pela soma do ledger;
- modo `notion` preservado como padrão durante a transição;
- migração, schema, serviços, rotas, testes e documentação produzidos nesta
  missão;
- checkpoint Git local da implementação e de seus relatórios.

## O que esta decisão não autoriza

- criação ou ativação de owner real;
- auditoria ou importação de dados legados;
- binding ou migração D1 remotos;
- corte do modo padrão para `d1`;
- push, deploy ou publicação;
- migração de finanças, treinos ou outros domínios.

Essas etapas permanecem separadas e exigem missões próprias. A observação de
sensibilidade de memória do harness fica registrada como risco não bloqueante
para ambientes restritos.
