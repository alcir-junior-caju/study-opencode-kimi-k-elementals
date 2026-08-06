---
name: hld-from-prd
description: Generates one or more HLDs (High-Level Design documents) in Portuguese Markdown from any technical document (PRD, RFC, design doc, architecture notes, technical memo, engineering proposal, spec). Use whenever the user provides a technical document and asks to produce, generate, create, or draft HLDs from it. Also trigger for phrases like "gerar HLD desse PRD", "criar HLDs a partir desse documento", "transformar esse doc em HLDs", "High Level Design a partir desse material", or similar variations. The skill analyzes the input, internally decides the architectural breakdown by subsystem or bounded context, and outputs one enumerated .md file per HLD (HLD-01, HLD-02, ...), each covering a cohesive architectural unit.
---

# HLD Generator from Technical Document

Generates a series of complete, actionable HLDs (High-Level Design documents) in Portuguese, as multiple separate Markdown files, based on any technical document provided by the user in the chat.

## When this skill runs

The user pastes or attaches a technical document in the chat and asks for HLDs. The document is the only input needed. There is NO interactive interview with the user. All reasoning is internal. The AI assumes the role of a Senior Software Architect and decides internally how to break the document into HLDs.

Accepted inputs include, but are not limited to: PRD, RFC, design doc, architecture notes, technical memo, engineering proposal, system description, feature brief, technical spec. The richer and more structured the input, the fewer items will be marked as `(hipótese)` in the output. Sparse inputs are still valid: gaps become hypotheses (see "Intelligent defaults" below).

## Core workflow

1. Read the document pasted in the chat end to end. If the document was provided as an attached file, read it with the appropriate tool before starting.
2. Identify the natural architectural breakdown using the "Breakdown heuristic" section below. Decide how many HLDs to generate and what each covers. Typical range is 1 to 6 HLDs.
3. For each HLD to be generated, internally assume the role of a Senior Software Architect and silently answer every reasoning block in the "Internal reasoning" section below. Do NOT show this reasoning to the user.
4. For each HLD, run the consistency checks in the "Consistency checks" section. Fix gaps before writing.
5. Write one HLD per identified subsystem, using the exact skeleton in "Output skeleton". Each HLD is a standalone document.
6. Save each HLD as `./docs/HLD-NN-<nome-curto>.md`, where `NN` is a zero-padded sequential number starting at `01`, and `<nome-curto>` is a short kebab-case name derived from the subsystem (ex: `HLD-01-autenticacao.md`, `HLD-02-pagamentos.md`).
7. Call `present_files` with ALL HLD paths in order (HLD-01 first, HLD-02 second, etc.) so the user can download them.
8. End with a brief 3-5 sentence summary listing how many HLDs were generated, what each one covers, and noting that hypotheses were marked where the document was silent. Do NOT output JSON. Do NOT output the HLD content inline in chat (the files are the deliverable).

## Scope rules

- Input is always a technical document pasted or attached in the chat. Any document that describes a system, component, process, or architecture is valid input (PRD, RFC, design doc, architecture notes, technical memo, spec, etc.). If the input is clearly NOT a technical document (essay, fiction, random chat conversation, raw code without context, unrelated material), respond with a short message asking the user to provide a technical document. Do NOT generate HLDs from non-technical input.
- The AI decides the breakdown internally. Do NOT ask the user how to split the document.
- One HLD per cohesive architectural unit, not one per functional requirement or per topic mentioned.
- Do NOT export JSON. Markdown only.
- Do NOT ask clarifying questions to the user before generating. The document is the source of truth. Gaps become hypotheses (see below).
- The HLDs focus on the technical "how". They do NOT repeat the business narrative or product context of the input document.

## Breakdown heuristic (how the AI decides how to split the document)

The AI analyzes the document as a Senior Software Architect and groups the content into cohesive architectural units. Each unit becomes one HLD. Use the following criteria to decide the breakdown:

- **Bounded contexts / domains**: Separate HLDs for distinct business domains that can evolve independently (ex: autenticação, catálogo, pagamentos, notificações).
- **Runtime concerns**: Separate HLDs when parts of the system have fundamentally different runtime profiles (ex: API síncrona de baixa latência vs. pipeline assíncrono de batch vs. agente LLM).
- **Data ownership**: Separate HLDs for subsystems that own their own source of truth and can be deployed independently.
- **Integration boundaries**: Separate HLDs for components that talk to different sets of external systems.
- **Cohesion of requirements**: Group functional requirements that share the same architecture, data model, and scalability profile into the same HLD.
  Rules to avoid bad splits:
- Do NOT create one HLD per FR. That is LLD territory, not HLD.
- Do NOT create an HLD for a trivial component that is really just an internal module of a larger system.
- If the document describes a single cohesive system with no meaningful internal boundaries, generate ONE HLD covering it entirely. One HLD is a valid answer.
- Most technical documents produce 1 to 6 HLDs. If the analysis suggests more than 6, reconsider and merge closely related units.
- Each HLD must be substantial enough to stand alone (clear objective, multiple components, flows, interfaces). If a candidate HLD would only have one component and no real flow, merge it into its parent.
  For each HLD, choose a short kebab-case name that reflects the subsystem (ex: `autenticacao`, `pagamentos-checkout`, `pipeline-ingestao`, `agente-recomendacao`).

## Internal reasoning (silent, as Senior Software Architect)

For EACH HLD to be generated, before writing it, answer each block below in your head using the document as primary source. If the document does not answer a block, fill the gap with a reasonable engineering default and mark it as `(hipótese)` in the final HLD.

1. **Technical objective**: What this subsystem does technically. What technical problems from the current state it addresses. Which other systems or features connect to it. Do NOT repeat the business narrative from the input document.
2. **General architecture**: High-level topology (layers, microservices, agents, pipelines). Main technologies with justification. Deployment environment (cloud, on-premises, hybrid). Architectural patterns adopted (ex: event-driven, hexagonal, REST/gRPC, CQRS).
3. **Components and responsibilities**: Main components, their roles, and explicit dependencies (internal and external). Who persists data, who caches, who orchestrates flows.
4. **Request and data flows**: End-to-end path of a typical request. Points of validation, transformation, queue/event/stream. Where and how data is persisted or replicated.
5. **Data model (high level)**: Main entities and relationships. Source of truth and sync/cache policies. Versioning and retention considerations.
6. **Public interfaces**: Exposed interfaces (APIs, queues, streams, SDKs). Protocols and formats (REST, gRPC, GraphQL, Avro, Protobuf). SLAs/limits and exposure scope (internal/external).
7. **Scalability and availability**: Scaling strategies (horizontal, partitioning, sharding). Caching, rate limiting, backpressure. Availability targets and failure recovery.
8. **Security**: Authentication, authorization, secrets management. Encryption in transit and at rest. PII handling and anonymization/pseudonymization.
9. **Observability**: Structured logs, key metrics, distributed tracing. Essential dashboards and alerts. Indicators for SLOs/SLAs.
10. **Architectural risks and mitigation**: Prioritized technical risks with probability and impact. Mitigations (supporting multiple items per risk). Contingency plans.
11. **ADRs and next steps**: Decisions already registered (links/titles if present in the document, otherwise mark as `(hipótese) a registrar`). Pending decisions and criteria for taking them. Next technical steps until FDD/LLD.

## Intelligent defaults (only when the document is silent, always marked as `(hipótese)`)

- Minimum observability: structured logs, error/latency metrics per interface, end-to-end distributed tracing.
- Minimum security: authentication, role-based authorization, encryption in transit, secrets managed by vault.
- Initial availability target: 99.9 per cent for external interfaces and 99.5 per cent for internal ones.
- Decision latency in critical middleware p95 less than 5 ms when low-latency cache/storage is available.
- p95 latency for synchronous APIs below 150 ms.
  Any of the above, when used because the document did not specify, MUST be written with the suffix `(hipótese)` so the reader knows it was inferred.

Sparse input handling: if the input document is short or under-specified, the HLD will legitimately contain many items marked `(hipótese)`. This is the correct behavior. The skill should not refuse the task in this case, but the final chat summary should briefly note that the output relies heavily on defaults because the input was sparse.

## Consistency checks (run before writing each HLD)

- Technical objective is clear and does NOT repeat the business narrative of the input document.
- General architecture supports the declared non-functional requirements found in the document.
- Components have explicit responsibilities and dependencies.
- Request and data flows are complete end-to-end.
- Data model names principal entities and relationships with source of truth.
- Public interfaces are listed with protocol and exposure.
- Scalability and availability strategies have concrete targets.
- Security and observability have measurable policies and practices.
- Risks have probability, impact, mitigations (as list), contingency plan.
- ADRs and next steps indicate taken and pending decisions.
  If a check fails, fix the gap (using a hypothesis if needed) before writing.

## Style rules

- Portuguese, simple and direct.
- Do NOT use em dashes `—`. Use commas, "e", or restructure the sentence.
- Follow the output skeleton EXACTLY: headings, bold, tables, lists.
- Mark inferred content as `(hipótese)`.
- Do NOT include sections that are not in the skeleton (no stakeholders, no cronograma, no appendices).
- If a section has no content from the input document and no reasonable hypothesis, omit its item entries but keep the section header. Do NOT write placeholder filler text.
- Each HLD file stands alone. Do NOT cross-reference other HLDs by file name inside the content (use the subsystem name instead).

## File naming and enumeration

- Files are saved in `./docs/`.
- Format: `HLD-NN-<nome-curto>.md` where `NN` is zero-padded (01, 02, ...).
- Enumeration is sequential in the order the HLDs should be read (usually: infrastructure/shared first, then domain-specific subsystems).
- The first line of each HLD (the `###` heading) should include the same enumeration prefix for clarity: `### HLD-01: Autenticação`.

## Output skeleton (exact format for each HLD)

Generate each HLD exactly in this Markdown structure. Replace everything inside `[ ]` with real content. Delete the bracket markers in the final output.

```markdown
### HLD-NN: [nome do subsistema]

Versão: [versao, ex: 1.0]
Data: [YYYY-MM-DD]
Responsável: [responsável técnico, ou "(hipótese) a definir"]

---

### Objetivo técnico

[Descrição clara do objetivo técnico e do problema que resolve, sem repetir a narrativa de negócio do documento de entrada.]

Dependências com outros sistemas

- [dependência 1]
- [dependência 2]

---

### Arquitetura geral

[Descrição da topologia, camadas, tecnologias e padrões.]

Ambiente de implantação

- [cloud / on-premises / híbrido]
- [descrição da topologia]

Tecnologias principais

- [tecnologia 1]
- [tecnologia 2]

Padrões adotados

- [padrão 1]
- [padrão 2]

---

### Componentes e responsabilidades

| Componente     | Responsabilidades   | Dependências   |
| -------------- | ------------------- | -------------- |
| [componente 1] | [responsabilidades] | [dependências] |
| [componente 2] | [responsabilidades] | [dependências] |

---

### Fluxo de requisições e de dados

**Fluxo de requisição**

- [passo 1]
- [passo 2]

**Fluxo de dados**

- [origem, transformação, destino]

---

### Modelo de dados (alto nível)

Entidades principais

- [entidade 1]
- [entidade 2]

Relações

- [relação 1]
- [relação 2]

Fonte de verdade

- [sistema que é o source of truth]

---

### Interfaces públicas

| Nome     | Tipo  | Protocolo | Exposição | SLAs/Limites                            |
| -------- | ----- | --------- | --------- | --------------------------------------- |
| [API X]  | API   | REST      | Externa   | [ex: p95 150 ms]                        |
| [Fila Y] | Queue | Kafka     | Interna   | [ex: consumo maior ou igual a N msgs/s] |

---

### Considerações de escalabilidade e disponibilidade

Abordagem geral

- [estratégia de scaling e resiliência]

Técnicas aplicadas

- [load balancing, caching, autoscaling, particionamento/sharding, backpressure]

Meta de disponibilidade

- [ex: 99.9 por cento de uptime mensal]

---

### Segurança

Autenticação

- [descrição]

Autorização

- [descrição]

Proteção de dados

- [criptografia em trânsito/repouso, PII, retenção]

Gestão de segredos

- [descrição]

---

### Observabilidade

Logs

- [política de logs estruturados]

Métricas

- [métricas essenciais por interface/componente]

Tracing

- [padrões de spans e amostragem]

Dashboards e alertas

- [itens principais]

---

### Riscos arquiteturais e mitigação

#### [risco 1 resumido em uma frase]

- **Probabilidade:** [baixa|media|alta]
- **Impacto:** [impacto esperado]
- **Mitigação:**
  - [ação 1]
  - [ação 2]
- **Plano de contingência:** [plano B]

#### [risco 2 resumido em uma frase]

- **Probabilidade:** [baixa|media|alta]
- **Impacto:** [impacto]
- **Mitigação:**
  - [ação]
- **Plano de contingência:** [plano B]

---

### ADRs e próximos passos

ADRs associados

- [ADR 001, decisão X]
- [ADR 002, decisão Y]

Decisões pendentes

- [descrição]

Próximos passos

- [ação técnica planejada]
```

## Examples

### Example 1: User pastes a PRD covering a checkout system

**Input (user turn):** Pastes a full PRD in the chat describing a checkout system with authentication, payment processing, order management, and notification subsystems, and says "Gera os HLDs desse documento".

**Correct behavior:**

1. Read the pasted document end to end.
2. Identify the architectural breakdown. In this case, likely 4 HLDs: autenticação, pagamentos, pedidos, notificações. Or possibly 3 if autenticação is trivial and fits inside pedidos.
3. For each HLD, silently reason through the 11 internal blocks as a Senior Software Architect. Mark gaps as `(hipótese)`.
4. Run consistency checks on each HLD. Fix gaps.
5. Write each HLD following the skeleton exactly.
6. Save as `./docs/HLD-01-autenticacao.md`, `HLD-02-pagamentos.md`, `HLD-03-pedidos.md`, `HLD-04-notificacoes.md`.
7. Call `present_files` with all four paths in order.
8. Respond with 3-5 sentences: "Foram gerados 4 HLDs a partir do documento: autenticação, pagamentos, pedidos e notificações. Cada HLD cobre um subsistema coeso com objetivo técnico, arquitetura, fluxos, interfaces, segurança, observabilidade e riscos. Itens não explicitados no documento foram marcados como hipótese. Arquivos disponíveis para download."

### Example 2: User pastes an RFC or design doc for a single cohesive module

**Input:** User pastes an RFC or design document describing a single recommendation engine with no clear internal boundaries.

**Correct behavior:**

- Generate ONE HLD, not multiple. One is a valid answer.
- Save as `./docs/HLD-01-motor-recomendacao.md`.
- Present the single file.
- Chat response confirms that a single HLD was generated because the document describes one cohesive module.

### Example 3: User pastes sparse engineering notes about a batch pipeline

**Input:** User pastes a short technical memo (1 to 2 pages) describing a batch ingestion pipeline with minimal NFR detail and says "Gera os HLDs disso".

**Correct behavior:**

- Treat the memo as valid input. Do NOT refuse just because it is short.
- Generate ONE HLD covering the pipeline.
- Use intelligent defaults for the items the memo does not cover (observabilidade, segurança, metas de disponibilidade, etc.), each marked as `(hipótese)`.
- In the final chat summary, briefly note that the HLD relies heavily on defaults because the input was sparse and recommend that the user review the items marked `(hipótese)`.

### Example 4: User pastes something that is not a technical document

**Input:** User pastes an essay, fiction, an unrelated chat log, or raw code without any architectural context and says "Gera HLDs disso".

**Correct behavior:**

- Do NOT generate HLDs from non-technical input.
- Respond with a short message explaining that the skill requires a technical document as input (PRD, RFC, design doc, technical memo, spec, etc.) and ask the user to provide one.
  **Incorrect behavior (do NOT do this in any example):**
- Asking the user how to split the document before generating.
- Generating one HLD per functional requirement.
- Outputting HLD content inline in chat instead of as .md files.
- Exporting a JSON version.
- Using em dashes `—` in the text.
- Repeating business narrative from the input document inside the HLDs.
- Generating a single consolidated file with all HLDs together (they must be separate files).
- Refusing a sparse but valid technical document just because it lacks detail. Use intelligent defaults marked as `(hipótese)` instead.

## Final checks before responding

- All HLD files exist in `./docs/` with correct `HLD-NN-<nome-curto>.md` naming.
- Enumeration is sequential and zero-padded, starting at `HLD-01`.
- Each file is a complete standalone HLD following the skeleton exactly.
- No em dashes `—` anywhere in any HLD.
- Every inferred item is marked `(hipótese)`.
- `present_files` was called with all HLD paths in order.
- No JSON was produced.
- The chat response is short (3-5 sentences), lists how many HLDs were generated and what each covers, and points to the files. If the input was sparse, the summary briefly mentions that the output relies heavily on hypotheses.
