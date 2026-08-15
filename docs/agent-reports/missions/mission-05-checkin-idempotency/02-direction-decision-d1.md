# Decisão da direção: ledger D1 para check-ins e XP

**Data:** 15 de agosto de 2026  
**Missão:** `mission-05-checkin-idempotency`  
**Decisão:** Arquitetura D1 aprovada para planejamento detalhado  
**Implementação:** Pendente do plano ajustado do Builder  
**Publicação e migração remota:** Não autorizadas nesta etapa

## Contexto

A investigação do Builder demonstrou que o Notion não oferece as primitivas
necessárias para garantir unicidade, idempotência e consistência transacional
do XP sob concorrência, retries e respostas ambíguas.

A direção humana aprovou a recomendação de usar um ledger transacional D1 como
fonte canônica dos check-ins e do XP, mantendo o Notion como projeção
eventualmente consistente.

## Decisões aprovadas

1. O D1 será a fonte canônica dos eventos de check-in e do total de XP.
2. O Notion continuará como projeção organizada, mas `XP total` deixará de ser
   a fonte oficial e poderá permanecer apenas como snapshot informativo.
3. Replays idênticos devem devolver o resultado canônico sem conceder XP ou
   criar uma página novamente.
4. Um payload diferente para a mesma identidade e data deve gerar conflito
   explícito, sem sobrescrita silenciosa.
5. Falhas ambíguas na criação do Notion devem privilegiar `at-most-once`: o
   evento canônico permanece salvo e a projeção fica pendente, sem repetir
   automaticamente um `POST /pages` potencialmente concluído.
6. O produto continua pessoal e de proprietário único nesta fase, mas o schema
   não deve impedir isolamento futuro por identidade autorizada.
7. Dados legados devem ser auditados antes de qualquer migração. Duplicatas ou
   inconsistências não podem ser apagadas, fundidas ou corrigidas
   automaticamente.
8. Nenhuma alteração de schema ou dado no Notion está autorizada nesta missão.
   Uma propriedade como `Shaft check-in ID` fica para decisão futura.
9. Configuração, schema e migrações locais do D1 podem ser preparados e
   testados, mas nenhum banco remoto será criado, migrado ou publicado sem uma
   etapa própria de implantação.

## Próximo passo autorizado

O Builder deve produzir um plano ajustado com schema, semântica transacional,
estratégia para dados legados, nomes exatos dos artefatos de migração, arquivos
afetados, testes e rollback. A implementação poderá avançar após a direção
confirmar que esse plano permanece dentro destas decisões.
