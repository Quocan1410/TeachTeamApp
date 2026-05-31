# TeachTeamApp documentation

| Document | Contents |
|----------|----------|
| [architecture.md](./architecture.md) | System architecture, data flows, Socket.IO |
| [database-erd.md](./database-erd.md) | ERD diagram (Mermaid) |
| [api-reference.md](./api-reference.md) | Main REST + GraphQL endpoints |
| [deployment.md](./deployment.md) | VPS (recommended), Vercel + Render |
| [CONSOLIDATED.md](./CONSOLIDATED.md) | Single combined file for PDF export |

**PDF export** (from repo root):

```bash
pandoc docs/CONSOLIDATED.md -o docs/TeachTeamApp-Documentation.pdf --toc
```
