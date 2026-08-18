---
repo: architecture
path: docs/architecture/aw-app-presentations.md
source: generated
edited: false
checksum: sha256:afc62e49d8519aaf61219a32689f305a7e3ac1e2b9a3c77591f7924e1fb2d276
---
# Presentations

- **repo**: aw-app-presentations
- **layer**: app
- **technologies**: python, react
- **health** (derived): planned

HTML presentations created by agents (reports, diagrams, code reviews, images) — top-bar gallery nav + a window that renders each presentation. Replaces the monolith's /ws/presentations feature and the aw-frontend static PresentationNav. Diff viewing lives in the separate aw-app-diff-tool.

## Connections
- `db` → **postgres** — app-owned tables in the workspace schema
- `http` → **aw-workspace** — routes mounted at /api/apps/presentations
- `stdio-mcp` → **mcp-gateway** — MCP surface aggregated by the gateway

## MCP tools
- `commented_file`
- `create_presentation`
- `delete_presentation`
- `export_presentation_to_image`
- `list_presentations`
- `share_presentation`
- `show_image`
- `update_presentation`

## Requirements
### Um share token abre exatamente a apresentação dele, e só enquanto vale
- Given um link compartilhado dispensa o JWT e carrega apenas ?token=
- When a rota de html resolve o token e compara o id resolvido com o id pedido na URL (repos/aw-app-presentations/presentations_app/routes.py::build_app.get_html:129, resolução em repos/aw-app-presentations/presentations_app/storage.py::PresentationStore.validate_share_token:225)
- Then token inválido, expirado ou de outra apresentação devolve 403 — sem a comparação de id um token válido qualquer viraria chave-mestra de todo o acervo, que é exatamente o que um link público não pode ser, e sem o teste de expires_at o link "temporário" nunca deixa de funcionar
- intended_status: `not_implemented` · derived health: `not_implemented`
- tests: `repos/aw-app-presentations/tests/test_storage_and_routes.py` (passing)

### Token expirado some da listagem, e revogar apaga a linha
- Given uma apresentação teve vários share tokens criados, alguns já vencidos
- When o painel lista os compartilhamentos ou revoga um (repos/aw-app-presentations/presentations_app/storage.py::PresentationStore.list_share_tokens:234 e ::revoke_share_token:247)
- Then a listagem traz só os ainda válidos e a revogação apaga a linha devolvendo False quando o token não existia — se vencidos aparecessem, a tela diria que há links vivos que não abrem nada, e quem audita "quem tem acesso" leria uma lista que não corresponde ao acesso real em nenhuma das duas direções
- intended_status: `not_implemented` · derived health: `not_implemented`
- tests: `repos/aw-app-presentations/tests/test_storage_and_routes.py` (passing)

### Export sem playwright responde 501 nomeando a dependência, não 500
- Given o pacote playwright não está instalado, ou está mas os binários do chromium nunca foram baixados
- When o export para PNG falha e a exceção é classificada antes de virar resposta (repos/aw-app-presentations/presentations_app/routes.py::_playwright_unavailable_reason:312, usado no handler em :105)
- Then as duas formas conhecidas viram 501 com texto dizendo qual passo de instalação falta, e qualquer outra falha continua 500 com a exceção real — sem a distinção o botão de export mostra stack trace de render para um problema que é de provisionamento, e ninguém instala o que falta porque a mensagem não diz o que falta
- intended_status: `not_implemented` · derived health: `not_implemented`
- tests: `repos/aw-app-presentations/tests/test_storage_and_routes.py` (passing)

### O chromium é instalado uma vez, preguiçosamente, e uma falha não é marcada como pronta
- Given a maioria dos workspaces nunca exporta nada, e o build do chromium é ~150 MB mais as bibliotecas de sistema
- When o primeiro export chama a instalação sob lock, com --with-deps e fallback não privilegiado quando sudo falha (repos/aw-app-presentations/presentations_app/routes.py::_ensure_chromium:236)
- Then o download acontece só no primeiro uso e nunca de novo, mas uma instalação que falhou não seta a flag de pronto e é tentada outra vez no export seguinte — marcar pronto no erro deixa a app permanentemente sem export com o log da causa já rotacionado, e sem --with-deps o chromium instala e não sobe, falhando por biblioteca faltando em vez de por binário faltando
- intended_status: `not_implemented` · derived health: `not_implemented`
- tests: `repos/aw-app-presentations/tests/test_storage_and_routes.py` (passing)
