# Team Workflow — 3 people, 8 hours

## 1. Roles and ownership

| Role | Owns | Primary folders | Also responsible for |
| --- | --- | --- | --- |
| **Frontend** | UI, UX, visual polish, the demo flow | `client/` | Connecting services to the API, mock data, responsive QA, demo-day screen |
| **Backend** | Endpoints, business logic, validation | `server/` | `docs/API_CONTRACT.md`, Postman collection, API tests |
| **Database** | Schema, SQL, data integrity, RLS | `database/` | Supabase project and keys, seed and demo data, query performance |

**Ownership means the final say plus the review, not exclusive access.** Anyone may touch any folder. Ping the owner when you do.

Shared responsibilities:
- `docs/API_CONTRACT.md`: Backend writes it, Frontend and Database approve it.
- Integration testing: everyone, at every sync point.
- The pitch: everyone knows the 3-minute demo script.

## 2. Git branching strategy (trunk-based, short-lived branches)

```
main                ← always runnable; demo is deployed from here
 ├─ feat/fe-items-page
 ├─ feat/be-items-api
 ├─ feat/db-items-schema
 └─ fix/be-validation-message
```

Rules:
1. **`main` must always run.** Never push something that breaks `npm run dev` or `npm run build`.
2. Branch names: `<type>/<area>-<short-desc>`, where area is `fe`, `be`, `db` or `docs`.
3. **Merge at least every 60–90 minutes.** Long-lived branches cause painful conflicts at hour 7.
4. Open a PR and have one teammate skim it for under 5 minutes. If everyone is heads-down, self-merge after `npm run build` and `npm test` pass, and say so in chat.
5. Before you open a PR, run `git pull --rebase origin main`.
6. Folder ownership means conflicts are rare. When one happens, the folder owner resolves it.
7. In the **final hour**: freeze features, make only `fix/*` branches, and tag the demo commit: `git tag demo && git push --tags`.

```bash
git switch -c feat/fe-items-page
# …work…
git add -A && git commit -m "feat(fe): items list with search"
git pull --rebase origin main
git push -u origin feat/fe-items-page   # open PR → merge → delete branch
```

## 3. Commit conventions (Conventional Commits)

```
<type>(<scope>): <imperative summary, ≤ 72 chars>
```

| type | use for |
| --- | --- |
| `feat` | new user-visible capability |
| `fix` | bug fix |
| `style` | UI or CSS polish with no logic change |
| `refactor` | code change without behaviour change |
| `docs` | documentation only |
| `test` | tests only |
| `chore` | tooling, deps, config |

Scopes: `fe`, `be`, `db`, `api`, `docs`, `ui`.

Examples:
- `feat(be): add GET /api/stats/overview`
- `feat(db): add comments table with RLS`
- `fix(fe): keep filters when paginating`
- `style(ui): tighten stat card spacing`

## 4. API-contract-first integration workflow

```
 1. Agree         2. Build in parallel                          3. Integrate
 ───────────      ──────────────────────────────────────        ─────────────
 Contract row  →  DB: table + seed            ─┐
 in API_CONTRACT  BE: endpoint vs memory store ├─▶ BE switches to Supabase ─▶ FE flips VITE_USE_MOCKS=false
                  FE: page vs mock service    ─┘                              → test together
```

1. **Agree (5 min per endpoint):** write the request and response JSON in `API_CONTRACT.md`. Use the existing envelope and error codes.
2. **Build in parallel:**
   - Frontend builds against the **mock branch** of the service, using mock data with the exact contract shape.
   - Backend builds against the **in-memory store**, which needs no database.
   - Database writes the table, constraints, RLS and seed data.
3. **Integrate:** Database shares the keys privately with Backend, Backend sets `server/.env`, and Frontend sets `VITE_USE_MOCKS=false`. Test the full flow together.
4. When a shape has to change, **update the contract first** and tell the team in chat.

## 5. Suggested 8-hour timeline

| Time | Everyone | Frontend | Backend | Database |
| --- | --- | --- | --- | --- |
| 0:00–0:45 | Read the problem, pick the MVP, write the API contract (see the adaptation guide) | | | |
| 0:45–1:00 | Assign tasks, create branches | | | |
| 1:00–3:30 | | Pages and flows on mocks | Endpoints on the memory store, plus tests | Schema, RLS, seed in Supabase |
| 3:30 | **Sync #1 (15 min):** connect the server to Supabase and test the endpoints in Postman | | | |
| 3:45–5:30 | | Flip to the real API, handle loading, error and empty states | Business logic, edge cases | Views and aggregates for stats, demo data |
| 5:30 | **Sync #2 (15 min):** full end-to-end run of the demo flow, bug list | | | |
| 5:45–7:00 | | Polish, responsive QA, copy | Fix bugs, deploy the API | Realistic demo data, backups |
| 7:00 | **Feature freeze.** Only fixes from here. | | | |
| 7:00–7:40 | Rehearse the demo twice, prepare the slides or README | | | |
| 7:40–8:00 | Buffer. Tag `demo`. Breathe. | | | |

## 6. Communication

- One chat channel, with pinned messages for **URLs**, **who is working on what**, and **blockers**.
- Post a blocker as soon as you've been stuck for **15 minutes**.
- Never paste secrets in chat. Share keys in person or through a password manager.
- Stand-up at every sync point. Each person gives one line on what's done, what's next and what's blocking them.

## 7. Definition of done (per feature)

- [ ] Works end to end against the **real** API (not mocks).
- [ ] Has loading, error and empty states (the components exist, so use them).
- [ ] Validation errors show next to the right fields.
- [ ] Works at 390px width.
- [ ] `npm run build` and `npm test` pass.
- [ ] Merged to `main`.
