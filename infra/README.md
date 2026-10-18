# Hosting: S3 + CloudFront + Route 53

Three stages, each its own private bucket and CloudFront distribution, all on the
`azapal-dev` AWS profile (account 574247904716).

| Stage | URL | Bucket (eu-west-2) | Deploy |
|---|---|---|---|
| dev | https://dev.partner.azapal.com | `azapal-partner-dashboard-dev` | `npm run deploy:dev` |
| staging | https://staging.partner.azapal.com | `azapal-partner-dashboard-staging` | `npm run deploy:staging` |
| prod | https://partner.azapal.com | `azapal-partner-dashboard-prod` | `npm run deploy:prod` |

Shared by all three: one ACM certificate (us-east-1) for `partner.azapal.com` +
`*.partner.azapal.com`.

Everything is tagged `project=azapal-partner-dashboard`, `stage=dev|staging|prod`
(`shared` on the certificate), `domain`, `Name` and `managed-by` — except the
CloudFront Origin Access Controls, which AWS doesn't let you tag.

## Deploying

```bash
scripts/deploy-dev.sh                 # build, upload, invalidate, wait
scripts/deploy-staging.sh --no-wait   # don't wait for the invalidation to finish
scripts/deploy-prod.sh                # asks before going live; --yes skips that
```

Each run builds into `.deploy/<stage>/` (gitignored; the committed `dist/` is left
alone), uploads hashed assets with a year's cache and everything else uncached, then
invalidates `/*`. Old hashed assets are kept so a browser mid-session on the last
release can still lazy-load its chunks.

Each stage needs its backend URL, or the deploy refuses to build (the app would
otherwise quietly fall back to localhost or the dev backend). Put it in a gitignored
file in the repo root:

```bash
# .env.dev.local
VITE_AZAPAL_BASE_URL_DEV=https://…/api/v1/azapal
# .env.staging.local
VITE_AZAPAL_BASE_URL_STAGING=https://…/api/v1/azapal
# .env.production.local
VITE_AZAPAL_BASE_URL_PROD=https://…/api/v1/azapal
```

## Provisioning

```bash
infra/provision.sh all      # or dev | staging | prod
```

Idempotent — it finds what exists and only creates what doesn't.

**DNS stays at GO54.** `azapal.com`'s DNS is hosted at GO54, whose panel can't
delegate a subdomain (no NS records), so Route 53 isn't used. The script prints the
CNAMEs to add there by hand. They're always CNAMEs: CloudFront has no fixed IP.

**The first time takes two runs.** CloudFront needs an issued certificate, and ACM
needs to see a validation CNAME at GO54 first. The first run creates the certificate
and buckets, prints that CNAME, and stops. Once it resolves (`dig CNAME
_….partner.azapal.com`) and ACM shows the certificate as issued, run it again: it
creates the distributions (OAC, SPA fallback of 403/404 → `/index.html`, HTTPS only,
HTTP/3, AWS security headers) and prints one CNAME per stage — `dev.partner`,
`staging.partner`, `partner` → its `xxxx.cloudfront.net` — marking the ones already live.

Per-stage settings (bucket names, domains, backend variable) live in
[stages.sh](stages.sh); nothing else needs editing to change them.
