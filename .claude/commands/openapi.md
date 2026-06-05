# Generate OpenAPI Documentation

Generate an OpenAPI 3.0 spec from this project's Express routes and write it to the file Swagger UI is configured to load.

## Arguments

`$ARGUMENTS` may contain:
- An output file path (e.g. `docs/openapi.yaml`). If omitted, detect from the swagger config (see Step 1).
- A routes directory (e.g. `routes/`). Defaults to `routes/`.

## Steps

### 1 — Find the swagger config and determine the output path

Read `config/swagger.js` (or `swagger.js` / `config/swagger.ts` if absent). Look for the `apis` array inside the `swagger-jsdoc` options — that array contains the file(s) swagger-jsdoc reads. Use the first `.yaml` or `.json` entry as the output path. If the swagger config cannot be found or has no `apis` entry pointing to a YAML/JSON file, default to `docs/openapi.yaml`.

### 2 — Read app.js to find mount prefixes

Read `app.js` (or `server.js` / `index.js` if absent). For every `app.use(path, router)` call, record the mount path (e.g. `'/api/auth'`, `'/api/job'`).

Find the **common prefix** shared by all mount paths (e.g. if all start with `/api`, the common prefix is `/api`). This becomes `servers[0].url`.

For each router, the **spec path prefix** is the mount path **with the common prefix stripped** (e.g. mount `'/api/auth'` with common prefix `/api` → spec prefix `/auth`).

### 3 — Read route files

Glob for all `*.js` files under the routes directory. For each file, read it and extract every route registration:
- HTTP method (`get`, `post`, `put`, `patch`, `delete`)
- Full spec path = spec prefix from Step 2 + route path, with Express params converted (`:id` → `{id}`)
- Middleware applied at the route level or via `router.use(...)` — note any `protect`, `authorize`, `authorizeRole` calls

### 4 — Read controllers

For each route, follow the `require(...)` path in the route file to find the controller. Read the handler function and extract:
- **`req.body` fields**: what is destructured or accessed from `req.body`
- **`req.params` fields**: any `req.params.X` accesses
- **`req.query` fields**: any `req.query.X` accesses
- **Response shape**: what is passed to `res.json(...)` or the response utility (e.g. `response.success(res, data, 201)`)
- **Auth**: whether `protect` middleware wraps this route → mark operation as `bearerAuth` secured

### 5 — Read validators

Glob broadly for validator files:
- `utils/validators.js`
- `utils/validators/index.js`
- `utils/validators/**/*.js`
- `validators/**/*.js`

Read every match. Use the Joi (or similar) schema field definitions to enrich request body `description`, `required`, and `enum` values. Map Joi types: `Joi.string()→string`, `Joi.number()→number`, `Joi.boolean()→boolean`, `Joi.array()→array`, `.valid(...values)→enum`, `.required()→required field`.

### 6 — Read models

Glob for `models/*.js` and read each one. Build `components/schemas` entries from Mongoose schema definitions. Type mapping:
- `String` → `string`
- `Number` → `number`
- `Boolean` → `boolean`
- `Date` → `string, format: date-time`
- `mongoose.Schema.Types.ObjectId` (or `ref: 'X'`) → `string, description: "ObjectId ref to X"`
- `[{ type: ... }]` array field → `array` with appropriate `items`

Also include `SuccessResponse` and `ErrorResponse` schemas derived from the response utility shape (read `utils/response.js` if present).

### 7 — Assemble the spec

Build a valid OpenAPI 3.0.3 YAML document with this structure:

```yaml
openapi: 3.0.3
info:
  title: <package.json "name", title-cased>
  version: <package.json "version">
  description: <package.json "description" if non-empty>
servers:
  - url: <common prefix from Step 2, e.g. /api>
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    <one entry per model, plus SuccessResponse and ErrorResponse>
paths:
  <one entry per unique spec path>
```

**Path rules (critical):**
- Paths must be relative to `servers[0].url`. Never include the common prefix in path keys.
  - Correct: `servers.url: /api` + path key `/auth/register`
  - Wrong:   `servers.url: /api` + path key `/api/auth/register`
- List `/resource/mine` (or any static segment) **before** `/resource/{id}` so Express-style static routes are not shadowed by the param route in the docs.

For each operation include:
- `summary`: short label derived from the handler name or route purpose
- `tags`: the route filename without extension (e.g. `auth`, `job`)
- `security`: `[{bearerAuth: []}]` when the route uses `protect` middleware; omit otherwise
- `requestBody`: for POST / PUT / PATCH — include all body fields with types and `required` list from the validator
- `parameters`: path params (`in: path`) and query params (`in: query`) from the controller
- `responses`: at minimum a success response (`200` or `201`) and error responses (`400`, `401`, `404`) where applicable; reference `$ref: '#/components/schemas/SuccessResponse'` and `$ref: '#/components/schemas/ErrorResponse'`

### 8 — Write the output file

Write the assembled YAML to the output path determined in Step 1.

### 9 — Report

Tell the user:
- The output file path written
- How many paths were documented
- Any routes skipped because the controller or handler could not be resolved
