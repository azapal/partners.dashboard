# Shared settings for provisioning and deploying the partner dashboard.
# Sourced, not run: `source infra/stages.sh <stage>`.
#
# One place that knows which bucket, domain and backend variable belong to each
# stage, so provision.sh and deploy.sh can never disagree about them.

export AWS_PROFILE="${AWS_PROFILE:-azapal-dev}"
export AWS_PAGER=""

# azapal.com's DNS lives at the registrar (GO54), and GO54's panel can't delegate
# a subdomain (no NS records), so Route 53 isn't used: the scripts print the CNAME
# records to add at GO54 instead. CloudFront has no fixed IP, which is why these
# are CNAMEs and never A records. See infra/README.md.
CERT_DOMAIN="partner.azapal.com"

# On everything that takes tags (buckets, the certificate, distributions).
# Origin Access Controls are the one piece CloudFront doesn't let you tag.
TAG_PROJECT="azapal-partner-dashboard"
TAG_MANAGED_BY="partners.dashboard/infra/provision.sh"
# AWS Partner Network attribution, required on every billed resource.
TAG_APN_ID="pc:93xo9pnyns1f2wulj7b2oxzli"

# Buckets live here; CloudFront is global, and its certificate has to be in
# us-east-1 whatever region the buckets are in.
BUCKET_REGION="eu-west-2"
CERT_REGION="us-east-1"

stage_settings() {
  case "$1" in
    dev)
      STAGE=dev
      BUCKET="azapal-partner-dashboard-dev"
      DOMAIN="dev.partner.azapal.com"
      VITE_MODE=dev
      BASE_URL_VAR=VITE_AZAPAL_BASE_URL_DEV
      ;;
    staging)
      STAGE=staging
      BUCKET="azapal-partner-dashboard-staging"
      DOMAIN="staging.partner.azapal.com"
      VITE_MODE=staging
      BASE_URL_VAR=VITE_AZAPAL_BASE_URL_STAGING
      ;;
    prod)
      STAGE=prod
      BUCKET="azapal-partner-dashboard-prod"
      DOMAIN="partner.azapal.com"
      VITE_MODE=production
      BASE_URL_VAR=VITE_AZAPAL_BASE_URL_PROD
      ;;
    *)
      echo "Unknown stage '$1' — expected dev, staging or prod." >&2
      return 1
      ;;
  esac
}

# The CloudFront distribution serving a domain, found by its alias rather than
# kept in a state file, so there is nothing to lose or let drift.
distribution_id_for() {
  aws cloudfront list-distributions \
    --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items, '$1')].Id | [0]" \
    --output text
}
