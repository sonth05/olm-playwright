# FEATURE REGISTRY

## Core
- `core/config/*`: canonical config layer, bridged from the legacy `config/*` files.
- `core/fixtures/*`: role-based fixtures and dual-role fixtures.
- `core/shared-pages/*`: shared page objects and components.
- `core/automation/*`: shared automation helpers and runner utilities.

## Modules
- `modules/auth`: login and registration pages/tests.
- `modules/homepage`: homepage, header, and logged-in landing flows.
- `modules/learning-core`: course, lesson, hoc-bai, and exercise flows.
- `modules/contest`: contest and cuoc-thi flows.
- `modules/community`: hoi-dap flows.
- `modules/kids-zone`: kids course-path flows.
- `modules/digital-library`: thu-vien-so flows.
- `modules/news`: tin-tuc flows.
- `modules/payment`: payment flows.

## Cross-role flows
- `cross-role-flows/giao-bai-den-lam-bai.e2e.spec.ts`
- `cross-role-flows/tao-de-den-giao-bai.e2e.spec.ts`
- `cross-role-flows/diem-danh-den-thong-ke.e2e.spec.ts`
- `cross-role-flows/hoi-dap-tu-bai-hoc.e2e.spec.ts`

## API
- `api/*.api.spec.ts` bridges the legacy API specs into the new top-level API entrypoint.
