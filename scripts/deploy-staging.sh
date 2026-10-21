#!/usr/bin/env bash
# Build and deploy the partner dashboard to staging. Options: see infra/deploy.sh.
exec "$(dirname "${BASH_SOURCE[0]}")/../infra/deploy.sh" staging "$@"
