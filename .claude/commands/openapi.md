# Generate OpenAPI Documentation

Generate an OpenAPI 3.0 spec from this project's Express routes.

## Arguments

`$ARGUMENTS` may contain:
- An output file path (e.g. `openapi.yaml` or `docs/openapi.json`). Defaults to `openapi.yaml` at the project root.
- A routes directory (e.g. `routes/`). Defaults to `routes/`.

Parse `$ARGUMENTS` for these values before starting. If ambiguous, prefer `.yaml` output.

## Steps

### 1 — Discover route files
Use Glob to find all `*.js` files under the routes directory. Also read `app.js` (or `server.js` / `index.js` if `app.js` is absent) to find the base path prefix each router is mounted on (e.g. `app.use('/api/auth', authRouter)` → prefix `/api/auth`).

### 2 — Extract routes
For each route file, read it and extract every route registration:
- HTTP method (`get`, `post`, `put`, `patch`, `delete`)
- Path pattern (combine mount prefix + route path, convert Express params `:id` → `{id}`)
- Any named middleware applied at the route or router level (e.g. `protect`, `authorize`, `rateLimiter`)

### 3 — Read controllers
For each route, locate its controller file (follow the `require(...)` path in the route file) and read the handler function. From the handler infer:
- **Request shape**: what fields are read from `req.body`, `req.params`, `req.query`
- **Response shape**: what is passed to `res.json(...)` or the response utility on success
- **Auth**: whether `protect` / `authorize` middleware is present → mark as `bearerAuth` secured

### 4 — Read models
Glob for `models/*.js` and read each one. Use Mongoose schema field definitions to build OpenAPI `components/schemas` entries. Map Mongoose types: `String→string`, `Number→number`, `Boolean→boolean`, `Date→string (format: date-time)`, `ObjectId ref→string (description: ObjectId ref to X)`.

### 5 — Read validators (if present)
If a `utils/validators.js` or similar exists, read it. Use any exported validator schemas to enrich request body descriptions.

### 6 — Assemble the spec
Build a valid OpenAPI 3.0.3 document:

```
openapi: 3.0.3
info:
  title: <derive from package.json "name" field, title-cased>
  version: <derive from package.json "version">
  description: <derive from package.json "description" if present>
servers:
  - url: /api   (or the common prefix you found in app.js)
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    <one entry per model>
paths:
  <one entry per unique path, grouped by path then method>
```

For each operation include:
- `summary`: short human-readable label derived from the handler name or route
- `tags`: the router filename without extension (e.g. `auth`)
- `security`: `[{bearerAuth: []}]` when the route uses `protect` middleware, omit otherwise
- `requestBody`: only for POST / PUT / PATCH — list body fields with their types
- `parameters`: path params and any notable query params
- `responses`: at minimum a `200` success and a `400`/`401`/`404` where applicable

### 7 — Write the output file
Write the assembled YAML (or JSON if the output path ends in `.json`) to the output path determined in step 1.

### 8 — Report
Tell the user:
- The output file path
- How many paths were documented
- Any routes skipped because the controller or handler could not be resolved
