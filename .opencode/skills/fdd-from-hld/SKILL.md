---
name: fdd-from-hld
description: Generates one or more FDDs (Feature Design Documents) in Portuguese Markdown from an HLD pasted or attached in the chat. Use when the user provides an HLD and asks to produce, generate, create, or draft FDDs, including phrases like "gerar FDD desse HLD", "criar FDDs a partir deste HLD", "transformar esse HLD em FDDs", or "Feature Design Doc a partir do HLD". If the user names a specific feature (ex: "gera o FDD do 2FA"), generates only ONE FDD for that feature; otherwise identifies cohesive features in the HLD and outputs one enumerated .md file per FDD. No interview; all reasoning is internal.
---

# FDD Generator from HLD

Generates complete, actionable FDDs (Feature Design Documents) in Portuguese, as separate Markdown files, based on an HLD provided by the user in the chat.

## When this skill runs

The user pastes or attaches an HLD in the chat and asks for FDDs. The HLD is the required input. The user MAY optionally name a specific feature to focus on. There is NO interactive interview with the user. All reasoning is internal. The AI assumes the role of a Senior Software Engineer / Tech Lead responsible for the feature implementation.

## Core workflow

1. Read the HLD pasted in the chat end to end. If the HLD was provided as an attached file, read it with the appropriate tool before starting.
2. Determine the FDD scope:
   - If the user explicitly named a specific feature alongside the HLD (ex: "gera o FDD da feature X", "quero um FDD para o rate limiter deste HLD"), generate ONLY one FDD for that named feature. Ignore the other features in the HLD.
   - Otherwise, analyze the HLD using the "Breakdown heuristic" section below and decide internally how many FDDs to generate and what each covers. Typical range is 1 to 5 FDDs.
3. For EACH FDD to be generated, internally assume the role of a Senior Software Engineer / Tech Lead and silently answer every block in the "Internal reasoning" section below. Do NOT show this reasoning to the user.
4. For each FDD, run the consistency checks in the "Consistency checks" section. Fix gaps before writing.
5. Write each FDD using the exact skeleton in "Output skeleton". Each FDD is a standalone document.
6. Save each FDD as `./docs/FDD-NN-<nome-curto>.md`, where `NN` is a zero-padded sequential number starting at `01`, and `<nome-curto>` is a short kebab-case name derived from the feature (ex: `FDD-01-rate-limiter.md`, `FDD-02-cache-invalidation.md`).
7. Call `present_files` with ALL FDD paths in order (FDD-01 first, FDD-02 second, etc.) so the user can download them.
8. End with a brief 3-5 sentence summary listing how many FDDs were generated, what each one covers, and noting that hypotheses were marked where the HLD was silent. Do NOT output JSON. Do NOT output the FDD content inline in chat (the files are the deliverable).

## Scope rules

- Input is always an HLD pasted or attached in the chat. If the input is clearly not an HLD (it is a PRD, raw engineering notes, random code, an essay), respond with a short message asking the user to provide an HLD first. Do NOT generate FDDs from non-HLD input.
- If the user names a specific feature alongside the HLD, ONLY that feature is documented. Other features present in the HLD are ignored for this run.
- If the user does NOT name a feature, the AI decides the breakdown internally. Do NOT ask the user how to split the HLD.
- One FDD per cohesive feature, not one per functional requirement.
- Do NOT export JSON. Markdown only.
- Do NOT ask clarifying questions before generating. The HLD is the source of truth. Gaps become hypotheses (see below).
- The FDD focuses on the technical "how to implement" of ONE feature inside the HLD context. It does NOT repeat the architecture narrative of the HLD nor the business narrative of the PRD.

## Breakdown heuristic (how the AI decides which features become FDDs)

**Priority 1 (user override):** If the user named a specific feature alongside the HLD, generate a single FDD for that feature and stop. Do not look for other features.

**Priority 2 (automatic breakdown):** Otherwise, analyze the HLD as a Senior Software Engineer / Tech Lead and identify cohesive features. Each feature becomes one FDD. Use the following criteria to decide what counts as a feature:

- **Own public contracts**: the feature exposes its own endpoint, SDK method, queue topic, stream, or CLI surface.
- **Distinct end-to-end flow**: the feature has a main flow that starts at a specific trigger and ends at a specific outcome, different from other features.
- **Own acceptance criteria and observability signals**: the feature can be independently tested, monitored, and validated.
- **Independent increment of value**: the feature can be implemented, shipped, and rolled back as a meaningful unit of work.
  Rules to avoid bad splits:
- Do NOT create an FDD for an internal module, helper, or utility that is just part of a bigger feature. FDDs describe features, not internal components.
- Do NOT create one FDD per functional requirement or user story. That is too granular and belongs in an LLD or test plan.
- If the HLD describes a single cohesive feature (ex: a rate limiter, a recommendation API, a webhook dispatcher), generate ONE FDD. One is a valid answer.
- Typical HLDs produce 1 to 5 FDDs. If the analysis suggests more than 5, reconsider and merge closely related features.
- Each FDD must be substantial enough to stand alone (clear flow, public contracts, acceptance criteria, risks). If a candidate FDD would only have one step and no real contract, merge it into its parent feature.
  For each FDD, choose a short kebab-case name that reflects the feature (ex: `rate-limiter`, `cache-invalidation`, `webhook-dispatch`, `2fa-login`).

## Internal reasoning (silent, as Senior Software Engineer / Tech Lead)

For EACH FDD to be generated, before writing it, answer each block below in your head using the HLD as primary source. If the HLD does not answer a block, fill the gap with a reasonable engineering default and mark it as `(hipótese)` in the final FDD.

1. **Contexto e motivação técnica**: which technical problem the feature solves, how it fits the HLD and existing systems, which actors participate, what the scope boundaries are.
2. **Objetivos técnicos**: measurable technical outcomes expected (latency, throughput, accuracy, idempotency). Deterministic behaviors or invariants that must hold.
3. **Escopo e exclusões**: what is included in this delivery and what is explicitly out.
4. **Fluxos detalhados**: end-to-end main flow and alternative/exception flows with concrete steps. Where validation, persistence, cache, and external calls happen. Diagrams (sequence, state, flow) when they add clarity.
5. **Contratos públicos**: function/method signatures, HTTP endpoints, payloads, headers, queue topics, or SDK surfaces. Minimal request/response examples in JSON for each contract. Status code and header semantics. Versioning policy. Rate limits, payload sizes, expected response times.
6. **Erros, exceções e fallback**: error matrix (condition, treatment, notes) covering at least timeouts, invalid input, dependency failure, and authorization failure. Resilience strategies (timeouts, retries, backoff, circuit breaker). Fallback policy. Invariants that must hold even under failure.
7. **Observabilidade**: essential metrics with concrete names, structured log format and required fields, tracing spans and sampling strategy. Cardinality and sensitive data protection. Minimum dashboards and alerts.
8. **Dependências e compatibilidade**: minimum versions of SDKs, services, and infrastructure. Impacts on existing interfaces and backward compatibility guarantees.
9. **Critérios de aceite técnicos**: objective, verifiable checklist covering functional correctness, performance, resilience, and observability. Numerical targets when applicable.
10. **Riscos e mitigação**: prioritized technical risks with probability and impact. Mitigations as a list (can have multiple items per risk). Contingency plan when applicable.

## Intelligent defaults (only when the HLD is silent, always marked as `(hipótese)`)

Use these only to fill gaps the HLD did not cover. Always suffix with `(hipótese)`.

- Timeout default for external calls: 2 seconds.
- Retry policy default: up to 3 attempts with exponential backoff and jitter.
- Circuit breaker default: trips at 50 per cent error rate over 20 consecutive requests, half-open after 30 seconds.
- Minimum observability: structured JSON logs with correlation ID, latency and error rate metrics per contract, distributed tracing with end-to-end spans, sampling at 10 per cent on success and 100 per cent on errors.
- Log retention default: 30 days for info, 90 days for error.
- Rate limit default for external APIs: 100 rps per caller, adjustable via config.
- Minimum acceptance targets: p95 latency less than 150 ms for synchronous APIs, availability of 99.9 per cent for external interfaces.
- Idempotency default: mutations accept an `Idempotency-Key` header and deduplicate for 24 hours.
  Any of the above, when used because the HLD did not specify, MUST be written with the suffix `(hipótese)` so the reader knows it was inferred.

## Consistency checks (run before writing each FDD)

- Technical context does not repeat the HLD architecture narrative nor the PRD business narrative.
- Every objective has a measure or invariant.
- Scope lists both included and excluded items.
- Main flow is end-to-end and enumerates concrete steps, not generic placeholders.
- Every public contract has a concrete minimal request example and response example in JSON, plus explicit status code and header semantics.
- Error matrix covers at least: timeout, invalid input, dependency failure, authorization failure.
- Observability lists specific metric names, log fields, and span names (not generic placeholders like "metrics about the feature").
- Dependencies table has component name and minimum version.
- Acceptance criteria are objective and verifiable (binary or numeric).
- Risks have probability, impact, mitigations as a list, and contingency plan.
  If a check fails, fix the gap (using a hypothesis if needed) before writing.

## Style rules

- Portuguese, simple and direct.
- Do NOT use em dashes `—`. Use commas, "e", or restructure the sentence.
- Follow the output skeleton EXACTLY: headings, bold, tables, lists, JSON code fences for contract examples.
- Mark inferred content as `(hipótese)`.
- Do NOT include sections that are not in the skeleton.
- If a section has no content from the HLD and no reasonable hypothesis, omit its list items but keep the section header. Do NOT write placeholder filler text.
- Each FDD file stands alone. Do NOT cross-reference other FDDs by file name inside the content (use the feature name instead).

## File naming and enumeration

- Files are saved in `./docs/`.
- Format: `FDD-NN-<nome-curto>.md` where `NN` is zero-padded (01, 02, ...).
- Enumeration is sequential in the order the FDDs should be read (usually: foundation features first, then dependent ones).
- The first line of each FDD (the `###` heading) includes the same enumeration prefix for clarity: `### FDD-01: [nome da feature]`.
- When only a single FDD is generated (user named a specific feature), still use `FDD-01-<nome>.md`.

## Output skeleton (exact format for each FDD)

Generate each FDD exactly in this Markdown structure. Replace everything inside `[ ]` with real content. Delete the bracket markers in the final output.

````markdown
### FDD-NN: [nome da feature]

Versão: [versao, ex: 1.0]
Data: [YYYY-MM-DD]
Responsável: [responsável técnico, ou "(hipótese) a definir"]

---

### 1. Contexto e motivação técnica

[Explicar o problema técnico que a feature resolve, como ela se encaixa no HLD e nos sistemas existentes, quais são os atores envolvidos e os limites do escopo. Não repetir a narrativa de negócio do PRD nem a narrativa arquitetural do HLD.]

Atores

- [ator 1]
- [ator 2]

Limites de escopo

- [limite 1]
- [limite 2]

---

### 2. Objetivos técnicos

- [objetivo 1, com medida ou invariante associada]
- [objetivo 2, com medida ou invariante associada]

---

### 3. Escopo e exclusões

**Incluído**

- [item 1]
- [item 2]

**Excluído**

- [item A]
- [item B]

---

### 4. Fluxos detalhados e diagramas

**Fluxo principal**

1. [passo 1]
2. [passo 2]
3. [passo 3]

**Fluxos alternativos e exceções**

- [variação 1, com gatilho e resultado]
- [variação 2, com gatilho e resultado]

**Diagramas** (opcional)

- [referência a diagrama de sequência, estados ou fluxo, se houver]

---

### 5. Contratos públicos

**[Contrato 1, ex: Endpoint de verificação]**

- Tipo: [function, method, http_endpoint, queue, stream ou sdk]
- Assinatura ou rota: [ex: POST /v1/limiter/check]
- Método: [GET, POST, PUT, DELETE, ou N/A]
- Limites: [rate, tamanho de payload, timeout esperado]
- Versionamento: [política, ex: versão no path, compatibilidade retroativa]
- Semântica de status e headers:
  - [status ou header 1, significado]
  - [status ou header 2, significado]

**Exemplo de requisição**

```json
{}
```

**Exemplo de resposta**

```json
{}
```

**[Contrato 2, se aplicável]**

- Tipo: [...]
- Assinatura ou rota: [...]
- Método: [...]
- Limites: [...]
- Versionamento: [...]
- Semântica de status e headers:
  - [...]

**Exemplo de requisição**

```json
{}
```

**Exemplo de resposta**

```json
{}
```

---

### 6. Erros, exceções e fallback

**Matriz de erros**

| Condição                       | Tratamento                       | Observações |
| ------------------------------ | -------------------------------- | ----------- |
| [timeout em dependência]       | [fallback para cache local]      | [notas]     |
| [input inválido]               | [retorna 400 com código de erro] | [notas]     |
| [falha de autorização]         | [retorna 401 ou 403]             | [notas]     |
| [falha da dependência crítica] | [circuito aberto, degrada]       | [notas]     |

**Estratégias de resiliência**

- Timeouts: [valor e escopo]
- Retries: [número de tentativas e condições]
- Backoff: [tipo e parâmetros]
- Circuit breaker: [gatilho e recuperação]

**Política de fallback**

- [o que acontece quando o caminho principal falha]

**Invariantes**

- [invariante 1 que deve se manter mesmo sob falha]
- [invariante 2]

---

### 7. Observabilidade

**Métricas**

- [nome da métrica 1, tipo, dimensões]
- [nome da métrica 2, tipo, dimensões]

**Logs**

- Formato: [ex: JSON estruturado]
- Campos essenciais: [correlation_id, feature, action, outcome, latency_ms, ...]
- Proteção de dados sensíveis: [política de mascaramento ou omissão]

**Tracing**

- Spans principais: [nome do span 1, nome do span 2]
- Amostragem: [estratégia, ex: 10 por cento em sucesso, 100 por cento em erro]

**Dashboards e alertas**

- [painel mínimo, ex: latência p95 por endpoint]
- [alerta mínimo, ex: erro acima de 2 por cento em 5 minutos]

---

### 8. Dependências e compatibilidade

| Componente     | Versão mínima | Observações |
| -------------- | ------------- | ----------- |
| [componente 1] | [vX.Y]        | [notas]     |
| [componente 2] | [vX.Y]        | [notas]     |

**Garantias de compatibilidade**

- [ex: manter compatibilidade retroativa do endpoint por uma major version]
- [ex: coexistência entre versões v1 e v2 por 6 meses]

---

### 9. Critérios de aceite técnicos

- [critério funcional 1, verificável]
- [critério de performance, ex: p95 menor que 100 ms em carga nominal]
- [critério de resiliência, ex: mantém disponibilidade em queda de 1 dependência]
- [critério de observabilidade, ex: todas as requisições geram log estruturado com correlation_id]

---

### 10. Riscos e mitigação

#### [risco 1 resumido em uma frase]

- **Probabilidade:** [baixa, media ou alta]
- **Impacto:** [impacto esperado]
- **Mitigação:**
  - [ação 1]
  - [ação 2]
- **Plano de contingência:** [plano B]

#### [risco 2 resumido em uma frase]

- **Probabilidade:** [baixa, media ou alta]
- **Impacto:** [impacto esperado]
- **Mitigação:**
  - [ação 1]
- **Plano de contingência:** [plano B]
````

## Examples

### Example 1: User pastes an HLD with multiple features

**Input (user turn):** Pastes a full HLD for a pagamentos subsystem that includes three features: tokenização de cartão, checkout síncrono, e webhooks de confirmação. Says "Gera os FDDs desse HLD".

**Correct behavior:**

1. Read the pasted HLD end to end.
2. Since the user did NOT name a specific feature, apply the breakdown heuristic. Identify three cohesive features: tokenização, checkout, webhooks.
3. For each FDD, silently reason through the 10 internal blocks as Senior Software Engineer / Tech Lead. Mark gaps as `(hipótese)`.
4. Run consistency checks on each FDD. Fix gaps.
5. Write each FDD following the skeleton exactly.
6. Save as `./docs/FDD-01-tokenizacao-cartao.md`, `FDD-02-checkout-sincrono.md`, `FDD-03-webhooks-confirmacao.md`.
7. Call `present_files` with all three paths in order.
8. Respond with 3-5 sentences: "Foram gerados 3 FDDs a partir do HLD de pagamentos: tokenização de cartão, checkout síncrono e webhooks de confirmação. Cada FDD cobre contexto técnico, fluxos, contratos públicos, tratamento de erros, observabilidade, dependências, critérios de aceite e riscos. Itens não explicitados no HLD foram marcados como hipótese. Arquivos disponíveis para download."

### Example 2: User pastes an HLD and names a specific feature

**Input:** User pastes an HLD for an authentication subsystem covering login, 2FA, social login, and recuperação de senha. Says "Gera só o FDD da feature de 2FA".

**Correct behavior:**

- User named a specific feature, so generate ONLY the FDD for 2FA. Ignore the other features in the HLD.
- Save as `./docs/FDD-01-autenticacao-2fa.md`.
- Present the single file.
- Chat response confirms that a single FDD was generated for 2FA as requested, and that the other features in the HLD were not documented in this run.

### Example 3: User pastes an HLD for a single cohesive feature

**Input:** User pastes an HLD describing a single rate limiter service with no other features inside, and says "Gera o FDD desse HLD".

**Correct behavior:**

- Generate ONE FDD, not multiple. One is a valid answer when the HLD describes a single cohesive feature.
- Save as `./docs/FDD-01-rate-limiter.md`.
- Present the single file.
- Chat response confirms that a single FDD was generated because the HLD describes one cohesive feature.

### Example 4: User pastes something that is not an HLD

**Input:** User pastes a PRD, raw engineering notes, or code and says "Gera FDDs disso".

**Correct behavior:**

- Do NOT generate FDDs from non-HLD input.
- Respond with a short message explaining that the skill requires an HLD as input, and suggest the user first generate an HLD (potentially using the `hld-from-prd` skill if the input is a PRD).
  **Incorrect behavior (do NOT do this in any example):**
- Asking the user which features to document before generating (when no feature was named, apply the breakdown heuristic internally).
- Holding an interview with the user (asking one question at a time about context, contracts, risks, etc.). This skill is fully automatic.
- Generating one FDD per functional requirement.
- Outputting FDD content inline in chat instead of as .md files.
- Exporting a JSON version.
- Using em dashes `—` in the text.
- Repeating the HLD architecture narrative or the PRD business narrative inside the FDDs.
- Generating a single consolidated file with all FDDs together (they must be separate files when multiple FDDs are produced).
- Ignoring a feature explicitly named by the user and generating FDDs for everything in the HLD anyway.

## Final checks before responding

- All FDD files exist in `./docs/` with correct `FDD-NN-<nome-curto>.md` naming.
- Enumeration is sequential and zero-padded, starting at `FDD-01`.
- Each file is a complete standalone FDD following the skeleton exactly.
- No em dashes `—` anywhere in any FDD.
- Every inferred item is marked `(hipótese)`.
- Every public contract has a concrete minimal request and response example in JSON.
- The error matrix has at least 4 rows covering timeout, input inválido, falha de dependência, and falha de autorização (or documented reasons why one does not apply).
- `present_files` was called with all FDD paths in order.
- No JSON export was produced.
- The chat response is short (3-5 sentences), lists how many FDDs were generated and what each covers, and points to the files.
- If the user named a specific feature, only that FDD was generated and the response explicitly confirms that other features in the HLD were not covered in this run.
