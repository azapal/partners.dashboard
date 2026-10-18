#!/usr/bin/env bash
#
# Builds the dashboard for one stage, uploads it to that stage's bucket and
# invalidates its CloudFront cache. Called by scripts/deploy-{dev,staging,prod}.sh;
# run those rather than this.
#
#   infra/deploy.sh <stage> [--yes] [--no-wait] [--skip-build]
#
#   --yes         don't ask before deploying to prod
#   --no-wait     return once the invalidation is created, not once it's done
#   --skip-build  upload the last build for this stage as it is
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=stages.sh
source "$ROOT/infra/stages.sh"

[ $# -ge 1 ] || { echo "usage: $(basename "$0") dev|staging|prod [--yes] [--no-wait] [--skip-build]" >&2; exit 64; }
stage_settings "$1"
shift
YES=0 WAIT=1 BUILD=1
for arg in "$@"; do
  case "$arg" in
    --yes) YES=1 ;;
    --no-wait) WAIT=0 ;;
    --skip-build) BUILD=0 ;;
    *) echo "unknown option $arg" >&2; exit 64 ;;
  esac
done

cd "$ROOT"
# Its own folder per stage, outside the committed dist/, so building staging
# never leaves a staging build where a prod deploy would pick it up.
OUT="$ROOT/.deploy/$STAGE"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

# ── Preflight ────────────────────────────────────────────────────────────────

# config.ts falls back to localhost when a stage's backend URL is missing (and
# staging/prod fall back to the dev URL). Either way the build succeeds and the
# deployed app quietly talks to the wrong backend, so refuse instead.
base_url_set() {
  [ -n "${!BASE_URL_VAR:-}" ] && return 0
  local f
  for f in ".env.$VITE_MODE.local" ".env.$VITE_MODE" ".env.local" ".env"; do
    [ -f "$f" ] && grep -Eq "^${BASE_URL_VAR}=.+" "$f" && return 0
  done
  return 1
}
if [ "$BUILD" = 1 ] && ! base_url_set; then
  echo "$BASE_URL_VAR isn't set, so a $STAGE build would call the wrong backend." >&2
  echo "Put it in .env.$VITE_MODE.local (gitignored), e.g.:" >&2
  echo "  $BASE_URL_VAR=https://api.example.com/api/v1/azapal" >&2
  exit 1
fi

DIST_ID="$(distribution_id_for "$DOMAIN")"
if [ -z "$DIST_ID" ] || [ "$DIST_ID" = "None" ]; then
  echo "No CloudFront distribution for $DOMAIN yet. Run: infra/provision.sh $STAGE" >&2
  exit 1
fi

if [ "$STAGE" = prod ] && [ "$YES" = 0 ]; then
  if [ -n "$(git status --porcelain -- src config index.html public package.json 2>/dev/null)" ]; then
    echo "Warning: uncommitted changes in the app — this deploys what's on disk, not what's committed."
  fi
  printf 'Deploy %s (%s) to PRODUCTION at https://%s? [y/N] ' "$(git rev-parse --short HEAD 2>/dev/null || echo '?')" "$(git branch --show-current 2>/dev/null || echo '?')" "$DOMAIN"
  read -r answer
  [ "$answer" = y ] || [ "$answer" = Y ] || { echo "Not deployed."; exit 1; }
fi

# ── Build ────────────────────────────────────────────────────────────────────

if [ "$BUILD" = 1 ]; then
  say "Building $STAGE (mode $VITE_MODE)"
  rm -rf "$OUT"
  VITE_APP_STAGE="$STAGE" npx vite build --mode "$VITE_MODE" --outDir "$OUT" --emptyOutDir
fi
[ -f "$OUT/index.html" ] || { echo "No build at $OUT." >&2; exit 1; }

# ── Upload ───────────────────────────────────────────────────────────────────
# Hashed assets first, with a year's cache: their names change whenever their
# contents do. Old ones are kept, not deleted — a browser still running the last
# release lazy-loads chunks by their old names, and deleting them would break it
# mid-session. Then everything else, uncached, with index.html among it, so the
# new index never points at an asset that isn't up yet.

say "Uploading to s3://$BUCKET"
if [ -d "$OUT/assets" ]; then
  aws s3 sync "$OUT/assets" "s3://$BUCKET/assets" --only-show-errors \
    --cache-control "public, max-age=31536000, immutable"
fi
aws s3 sync "$OUT" "s3://$BUCKET" --only-show-errors --delete --exclude "assets/*" \
  --cache-control "public, max-age=0, must-revalidate"

# ── Invalidate ───────────────────────────────────────────────────────────────
# "/*" is billed as one path, and it's the unhashed files (index.html, the logo,
# anything in public/) that need it — the hashed assets never go stale.

say "Invalidating CloudFront $DIST_ID"
INVALIDATION_ID="$(aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" \
  --query 'Invalidation.Id' --output text)"
echo "  invalidation $INVALIDATION_ID"
if [ "$WAIT" = 1 ]; then
  aws cloudfront wait invalidation-completed --distribution-id "$DIST_ID" --id "$INVALIDATION_ID"
  echo "  complete"
fi

say "Deployed $STAGE → https://$DOMAIN"
