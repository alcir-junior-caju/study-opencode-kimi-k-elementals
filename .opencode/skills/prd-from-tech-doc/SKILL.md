---
name: prd-from-tech-doc
description: Generates a complete PRD (Product Requirements Document) in Portuguese Markdown from any technical document provided as input, regardless of the system's nature (web service, batch pipeline, library, CLI, client app, firmware, ML serving, etc.). Use whenever the user provides a technical document (spec, RFC, design doc, architecture notes, feature brief, technical memo, engineering proposal, system description) and asks to produce, generate, create, draft, or extract a PRD from it. Also trigger when the user says things like "gerar PRD deste documento", "criar PRD a partir disso", "transformar esse doc em PRD", "quero um PRD baseado nesse material", or any variation where the input is technical content and the desired output is a PRD. The skill always outputs a single complete .md file ready for download, covering the entire document in one PRD (not fragmented per feature).
---

# PRD Generator from Technical Document

Generates one complete, actionable PRD in Portuguese, as a single Markdown file, based on a technical document provided by the user. The skill is domain-agnostic: it adapts its defaults and emphasis to the type of system described in the document, instead of assuming the system is a web service.

## When this skill runs

The user provides a technical document (PDF, DOCX, TXT, MD, notes pasted in chat, etc.) and asks for a PRD. The technical document is the only input needed. There is NO interactive interview with the user. All reasoning is internal.

## Core workflow

1. Read the technical document(s) provided, end to end. If the document is attached as a file, read it with the appropriate tool before starting.
2. Internally assume the role of a Senior Software Engineer and silently answer every reasoning block below, starting with Block 0 (system classification). Do NOT show this reasoning to the user.
3. Run the consistency checks in the "Consistency checks" section. Fix gaps before writing.
4. Write one complete PRD covering the ENTIRE document, using the exact skeleton in "Output skeleton". Not one PRD per feature. One PRD for the whole thing.
5. Save the PRD as `./docs/PRD-<nome-curto>.md`, where `<nome-curto>` is a short kebab-case name derived from the product/feature.
6. Call `present_files` with the PRD path so the user can download it.
7. End with a brief 2-3 sentence summary of what was generated. Do NOT output JSON. Do NOT output the PRD content inline in chat (the file is the deliverable).

## Scope rules

- One PRD per technical document (or per set of related documents the user provides in the same turn).
- Do NOT generate multiple PRDs segmented per feature. The PRD aggregates everything.
- Do NOT export JSON. Markdown only.
- Do NOT ask clarifying questions to the user before generating. The technical document is the source of truth. Gaps become hypotheses (see below).

## Internal reasoning (silent, as Senior Software Engineer)

Before writing the PRD, answer each block below in your head using ONLY the technical document. If the document does not answer a block, fill the gap with a reasonable engineering default and mark it as `(hipótese)` in the final PRD.

### Block 0: System classification (MANDATORY, first step)

Identify the dominant nature of the system described in the document. Pick ONE primary type, and optionally a secondary type if the system has clear hybrid character (ex: SDK that also exposes a CLI). The classification drives which defaults, NFRs, and skeleton sections apply.

Allowed types:

- `web_service`: HTTP API, RPC service, customer-facing or internal service, monolith or microservice, serverless function exposed via endpoint.
- `batch_or_pipeline`: scheduled job, ETL, data pipeline, streaming consumer, background worker, async job runner.
- `library_or_sdk`: code shipped to other developers (package, framework, SDK, plugin).
- `cli_tool`: command-line executable used by humans or scripts.
- `client_app`: mobile app, desktop app, single-page web app, browser extension, game.
- `firmware_or_embedded`: code running on devices with constrained resources.
- `ml_model_or_inference`: trained model, inference service, training pipeline, evaluation harness.
- `infrastructure_or_platform`: cluster, network, observability stack, internal platform, IaC module.
- `other`: when no type fits cleanly. In this case, do NOT apply any of the type-specific defaults below; derive everything from the document.
  The chosen type is recorded internally and used by Block 6 (NFRs), Block 7 (architecture), the defaults section, and the consistency checks. The type itself is NOT written as a labeled field in the final PRD; it only shapes content choices.

### Block 1 to 12

1. **Context and vision**: What product/system is this. Existing system or new system. Target audience or consumer (humans, other services, other developers, devices). Business or technical goal in 2-3 sentences.
2. **Problem and opportunity**: What is slow, expensive, unsafe, fragile, or missing today. Concrete examples with approximate numbers when available. What has already been tried.
3. **Goals and success metrics**: For each goal, define metric and target value. Quantify whenever possible. The nature of the metric depends on the system type (latency for `web_service`, throughput for `batch_or_pipeline`, adoption for `library_or_sdk`, time-to-task for `cli_tool`, etc.).
4. **Scope**: What must exist in this delivery. What is explicitly out of scope.
5. **Functional requirements**: One entry per requirement, each with id (FR-001, FR-002, ...), name, description, main flow (step by step), alternative flows and exceptions, known errors, priority (alta / media / baixa).
6. **Non-functional requirements**: Apply the NFR profile that matches the system type from Block 0. See "Type-aware NFR defaults". Always include the NFRs that make sense for the type; omit NFR subsections that do not apply (do not force "Acessibilidade" on a backend service, do not force "Disponibilidade" on a library).
7. **Architecture and approach**: Describe where and how the system runs, using terms that fit the type. For `web_service`: deployment topology, sync/async, queue/cache/streaming, integrations. For `batch_or_pipeline`: scheduling, source/sink, parallelism, retry. For `library_or_sdk`: distribution, language/runtime targets, public surface. For `cli_tool`: invocation model, IO contract, OS targets. For `client_app`: platforms, offline behavior, state sync. For `firmware_or_embedded`: hardware target, memory/CPU envelope, update model. For `ml_model_or_inference`: training vs inference path, model format, serving runtime. For `infrastructure_or_platform`: topology, control plane, blast radius.
8. **Decisions and trade-offs**: Each meaningful technical decision with justification and trade-off.
9. **Dependencies**: External, organizational, or technical. Be specific about who must deliver what.
10. **Risks and mitigation**: Each risk with probability (baixa / media / alta), impact, mitigation actions (as a list, supporting multiple items), contingency plan.
11. **Acceptance criteria**: Objective, verifiable checklist. Avoid vague phrases like "funciona bem".
12. **Tests and validation**: Required test types (unit, integration, security, load, contract, fuzzing, compatibility matrix, hardware-in-the-loop, model evaluation, etc., picking what fits the type) and validation strategy (TDD, QA by script, exploratory, canary, shadow traffic, etc.).

## Type-aware NFR defaults (used only when the document is silent, always marked as `(hipótese)`)

Pick defaults from the profile that matches Block 0. If a profile is irrelevant to the system, OMIT that NFR subsection entirely in the final PRD; do NOT force a hypothesis. Any default below, when used because the document did not specify, MUST be written with the suffix `(hipótese)`.

**`web_service`**

- Performance: p95 abaixo de 150 ms para chamadas síncronas; throughput compatível com a carga estimada.
- Disponibilidade: 99.9 por cento para sistemas voltados ao cliente, 99.5 por cento para sistemas internos.
- Segurança e autorização: autenticação obrigatória, autorização por papel, trilha de auditoria para alterações sensíveis.
- Observabilidade: logs estruturados, métricas de erro por endpoint, tracing distribuído ponta a ponta.
- Confiabilidade e integridade: operações com efeitos colaterais críticos devem ser transacionais ou idempotentes.
- Compatibilidade: contrato de API versionado, breaking changes apenas em nova versão major.
  **`batch_or_pipeline`**
- Performance: SLA de janela de processamento explícito (ex: processar lote diário em até X horas).
- Confiabilidade: reprocessamento seguro via idempotência ou checkpoint; tolerância a falhas parciais.
- Observabilidade: logs por execução, métricas de duração e volume, alertas em falha e em atraso de fila.
- Integridade de dados: garantias de exactly-once ou at-least-once explicitadas; tratamento de poison messages.
- Segurança e autorização: credenciais rotacionáveis, acesso mínimo aos dados de origem e destino.
  **`library_or_sdk`**
- Compatibilidade: versionamento semântico, compatibilidade retroativa em versões minor e patch.
- Performance: overhead aceitável para o caso de uso típico; sem alocações desnecessárias em hot paths.
- Segurança: ausência de dependências com CVEs conhecidos; sem efeitos colaterais não documentados.
- Observabilidade no consumidor: hooks ou logs estruturados opcionais para integração com o app cliente.
- Documentação: API pública totalmente documentada, exemplos executáveis.
  **`cli_tool`**
- Performance: tempo de inicialização razoável para uso interativo.
- Usabilidade: exit codes consistentes, mensagens de erro acionáveis, suporte a `--help` e `--version`.
- Compatibilidade: matriz de sistemas operacionais e arquiteturas declarada.
- Segurança: nenhum secret em logs ou em argumentos de processo visíveis.
  **`client_app`**
- Performance: tempo de cold start aceitável, tamanho de bundle ou binário sob limite definido.
- Disponibilidade: comportamento offline explícito (degradação graciosa, sincronização posterior).
- Acessibilidade: conformidade com padrão aplicável (ex: WCAG AA para web, diretrizes de plataforma para mobile).
- Segurança: armazenamento local protegido, sem envio de dados sensíveis sem consentimento.
- Compatibilidade: versões mínimas de sistema operacional e dispositivos suportados.
  **`firmware_or_embedded`**
- Performance: envelope de memória e CPU respeitado em pior caso.
- Confiabilidade: robustez a falha de energia, watchdog, modo seguro de recuperação.
- Atualização: modelo de update (OTA, USB, manual) com rollback.
- Segurança: boot verificado e atualização assinada, quando aplicável.
  **`ml_model_or_inference`**
- Performance: latência de inferência e throughput sob carga prevista.
- Qualidade do modelo: métricas de qualidade com baseline e meta (ex: AUC, F1, accuracy, RMSE).
- Confiabilidade: comportamento em entradas fora da distribuição, fallback determinístico.
- Versionamento: modelos versionados, com possibilidade de rollback para versão anterior.
- Observabilidade: monitoramento de drift de entrada e de saída.
  **`infrastructure_or_platform`**
- Disponibilidade: SLO da plataforma e blast radius de mudanças.
- Segurança: princípio do menor privilégio, segmentação de rede, gestão de segredos.
- Observabilidade: telemetria do plano de controle e do plano de dados.
- Operabilidade: runbooks, automação de provisionamento, drift detection.
  **`other`**
- Sem defaults. Derive todas as NFRs do documento. Marque como `(hipótese)` apenas o que for inferência sua a partir do contexto explícito do doc.

### NFRs transversais (avaliar para qualquer tipo)

Avalie sempre, mas inclua no PRD apenas se houver indício no documento OU se a inferência for forte:

- **Compliance**: inclua somente se o documento mencionar regulação aplicável (ex: LGPD, GDPR, PCI-DSS, HIPAA, SOC2) ou se o domínio do sistema claramente exigir.
- **Acessibilidade**: inclua somente se houver UI ou consumidor humano direto. Para serviços de backend sem UI, omita.
- **Portabilidade**: inclua quando houver mais de um ambiente de execução previsto.

## Consistency checks (run before writing the PRD)

- Block 0 foi executado e a classificação primária é coerente com o conteúdo do documento.
- Every goal has metric and target.
- Every functional requirement has id, name, description, main flow, priority.
- Os NFRs presentes correspondem ao perfil do tipo escolhido em Block 0. Não há NFR irrelevante forçado (ex: "Disponibilidade" em uma biblioteca, "Acessibilidade" em um serviço backend sem UI).
- Out-of-scope items do not contradict in-scope items.
- A arquitetura proposta usa terminologia compatível com o tipo (ex: não falar em "endpoint" para uma biblioteca).
- A arquitetura proposta suporta os NFRs declarados.
- Every relevant technical decision has justification and trade-off.
- Every dependency is specific (who delivers what, and why it is needed).
- Every risk has probability, impact, mitigation (as list), contingency plan.
- Acceptance criteria are objective and verifiable.
- Required test types are appropriate to the system type (ex: testes de carga para `web_service`, evaluation de modelo para `ml_model_or_inference`, compatibility matrix para `library_or_sdk`).
  If a check fails, fix the gap (using a hypothesis if needed) before writing.

## Style rules

- Portuguese, simple and direct.
- Do NOT use em dashes `—`. Use commas, "e", or restructure the sentence.
- Follow the output skeleton EXACTLY: headings, bold, tables, lists. The only adaptive part is the set of NFR subsections, which depends on Block 0.
- Mark inferred content as `(hipótese)`.
- Do NOT include sections that are not in the skeleton (no next steps, no stakeholders, no dates/timelines, no appendices, no references).
- If a section has no content from the document and no reasonable hypothesis, omit its item entries but keep the section header. Do NOT write placeholder filler text.
- Do NOT mention the system type classification explicitly in the PRD. It is an internal scaffolding decision.
- Do NOT use examples bound to a specific business domain (ex: estoque, saldo, checkout) unless the source document is itself about that domain.

## Output skeleton (exact format)

Generate the PRD exactly in this Markdown structure. Replace everything inside `[ ]` with real content. Delete the bracket markers in the final output. The NFR section adapts to the system type (include only the subsections that fit, per the type-aware defaults above).

```markdown
### PRD: [produto] [feature ou nome do sistema]

Versão: [versao, ex: 1.0]
Data: [YYYY-MM-DD]
Responsável: [responsavel pelo PRD, ou "(hipótese) a definir"]

---

### Resumo

[Resumo em 3 a 6 linhas explicando o que é a feature ou sistema, por que existe, e qual o objetivo de negócio ou técnico.]

---

### Contexto e problema

Público-alvo ou consumidor

- [quem ou o que consome este sistema]

Cenários de uso chave

- [cenário 1]
- [cenário 2]

Onde essa feature será implantada

- [Sistema existente ou novo sistema. Descrever brevemente o ambiente de execução adequado ao tipo: serviço, pipeline, biblioteca, CLI, app cliente, firmware, modelo, plataforma.]

Problemas priorizados

- [problema 1, com impacto e prioridade]
- [problema 2, com impacto e prioridade]

---

### Objetivos e métricas

| Objetivo     | Métrica                                 | Meta            |
| ------------ | --------------------------------------- | --------------- |
| [objetivo 1] | [métrica apropriada ao tipo de sistema] | [meta numérica] |
| [objetivo 2] | [métrica]                               | [meta]          |

---

### Escopo

Incluso

- [item incluso 1]
- [item incluso 2]

Fora de escopo

- [item fora 1]
- [item fora 2]

---

### Requisitos funcionais

#### FR-001 [nome do requisito]

[Descrição em uma ou duas frases simples.]

**Fluxo principal**

- [passo 1]
- [passo 2]

**Fluxos alternativos e exceções**

- [variação ou exceção 1]

**Erros previstos**

- [erro previsto 1]

**Prioridade:** [alta|media|baixa]

---

#### FR-002 [nome do requisito 2]

[Descrição.]

**Fluxo principal**

- [passo 1]
- [passo 2]

**Fluxos alternativos e exceções**

- [variação]

**Erros previstos**

- [erro]

**Prioridade:** [alta|media|baixa]

---

### Requisitos não funcionais

[Inclua apenas as subseções abaixo que se aplicam ao tipo do sistema, conforme o perfil correspondente em "Type-aware NFR defaults". Pode haver subseções extras quando o documento exigir.]

Performance

- [meta apropriada ao tipo do sistema]

Disponibilidade

- [meta apropriada ao tipo do sistema; omitir esta subseção se não fizer sentido, ex: biblioteca pura]

Segurança e autorização

- [requisitos de segurança aplicáveis]

Observabilidade

- [requisitos de observabilidade aplicáveis ao tipo]

Confiabilidade e integridade

- [garantias necessárias]

Compatibilidade e portabilidade

- [versões, plataformas, runtimes suportados]

Compliance

- [incluir apenas se houver regulação aplicável citada no doc ou claramente exigida pelo domínio]

Acessibilidade

- [incluir apenas se houver UI ou consumidor humano direto]

---

### Arquitetura e abordagem

Abordagem

- [Descrição da abordagem geral, usando vocabulário compatível com o tipo do sistema.]

Componentes

- [componente 1]
- [componente 2]

Integrações

- [integração 1]
- [integração 2]

### Decisões e trade-offs

#### Decisão: [decisão 1]

- **Justificativa:** [por que essa decisão foi tomada]
- **Trade-off:** [custo ou limitação associada]

#### Decisão: [decisão 2]

- **Justificativa:** [justificativa]
- **Trade-off:** [trade-off]

---

### Dependências

#### [tipo da dependência, ex: Técnica / Organizacional / Externa]: [título]

[Descrição. Quem precisa entregar o quê, e por quê.]

#### [tipo]: [título 2]

[Descrição.]

---

### Riscos e mitigação

#### [risco 1 resumido em uma frase]

- **Probabilidade:** [baixa|media|alta]
- **Impacto:** [impacto esperado]
- **Mitigação:**
  - [ação de mitigação 1]
  - [ação de mitigação 2]
- **Plano de contingência:** [plano B]

#### [risco 2 resumido em uma frase]

- **Probabilidade:** [baixa|media|alta]
- **Impacto:** [impacto]
- **Mitigação:**
  - [ação]
- **Plano de contingência:** [plano B]

---

### Critérios de aceitação

Checklist objetivo que define se a feature está pronta.

- [critério 1]
- [critério 2]
- [critério 3]

---

### Testes e validação

Tipos de teste obrigatórios

- [tipos apropriados ao tipo do sistema, ex: unit, integration, contract, carga, evaluation de modelo, matriz de compatibilidade, hardware-in-the-loop]

Estratégia de validação

- [descrição da abordagem de validação]
```

## Examples

### Example 1: User attaches a backend service design doc

**Input:** User attaches `design-servico-notificacoes.pdf` and says "Gera o PRD desse doc aqui".

**Correct behavior:**

1. Read the PDF end to end.
2. Block 0: classify as `web_service`.
3. Reason silently through Blocks 1 to 12 using the `web_service` NFR profile. Mark gaps as `(hipótese)`.
4. Run consistency checks. Fix gaps. Omit "Acessibilidade" because there is no UI.
5. Write one complete PRD covering the whole document.
6. Save to `./docs/PRD-servico-notificacoes.md`.
7. Call `present_files`.
8. Respond in 2-3 sentences indicating the PRD was generated and which items were marked as `(hipótese)`.

### Example 2: User pastes pipeline notes in chat

**Input:** User pastes engineering notes about a nightly data pipeline and says "Transforma isso num PRD".

**Correct behavior:**

- Treat the pasted text as the technical document.
- Block 0: classify as `batch_or_pipeline`.
- Apply the `batch_or_pipeline` NFR profile: foco em SLA de janela, idempotência, observabilidade por execução. Omit subseções de UI e do perfil `web_service` que não se aplicam.
- Same workflow. Save to `./docs/PRD-<nome-derivado>.md`.
- Present the file.

### Example 3: User attaches an SDK proposal

**Input:** User attaches `proposta-sdk-pagamentos.md`.

**Correct behavior:**

- Block 0: classify as `library_or_sdk` (possibly with `web_service` as secondary if the SDK wraps an HTTP API).
- Apply the `library_or_sdk` NFR profile: versionamento semântico, compatibilidade retroativa, documentação pública. Omit "Disponibilidade" pois biblioteca não tem uptime próprio.
- Vocabulário da arquitetura deve falar em distribuição, runtimes alvo, superfície pública, em vez de endpoints ou containers.
- Save and present.

### Incorrect behavior (do NOT do this, regardless of example)

- Generating multiple PRDs, one per feature mentioned in the document.
- Asking the user interview questions before generating.
- Outputting the PRD inline in chat instead of as a .md file.
- Exporting a JSON version.
- Using em dashes `—` in the text.
- Forçar NFRs do perfil `web_service` em um sistema que não é serviço (ex: cravar p95 < 150 ms numa biblioteca ou em firmware).
- Usar exemplos de domínio (estoque, saldo, checkout) quando o documento de origem não é desse domínio.
- Mencionar a classificação de tipo dentro do PRD final.

## Final checks before responding

- The output file exists in `./docs/`.
- The file is a single complete PRD, not fragmented.
- The PRD follows the skeleton exactly (headings, bold labels, tables, bullets), with NFR subsections adapted ao tipo do sistema.
- No em dashes `—` anywhere in the PRD.
- Every inferred item is marked `(hipótese)`.
- Nenhum NFR foi forçado fora do perfil aplicável.
- Nenhum exemplo de domínio específico foi usado sem respaldo no documento original.
- `present_files` was called.
- No JSON was produced.
- The chat response is short (2-3 sentences) and points to the file.
