#!/usr/bin/env bash
#
# Creates everything a stage of the partner dashboard is served from:
#
#   ACM certificate, partner.azapal.com + *.partner.azapal.com  (shared, us-east-1)
#   a private S3 bucket                           (per stage)
#   a CloudFront distribution reading it via OAC  (per stage)
#
# and prints the CNAME records to add at GO54, where azapal.com's DNS lives.
#
#   infra/provision.sh dev
#   infra/provision.sh staging
#   infra/provision.sh prod
#   infra/provision.sh all
#
# Safe to run again: every step looks for what it would create first and leaves
# an existing one alone (bar re-applying tags and bucket settings). That is also
# how it gets past the one step that can't finish in a single run — see below.
#
# ── Two runs, the first time ──────────────────────────────────────────────────
# CloudFront only takes a custom domain once its certificate is issued, and ACM
# only issues it once it can see a validation CNAME — which has to be added at
# GO54 by hand. So the first run stops after the certificate and buckets and
# prints that record. Once ACM has seen it, run this again and it carries on.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=stages.sh
source "$ROOT/stages.sh"

# AWS managed policies.
CACHING_OPTIMIZED="658327ea-f89d-4fab-a63d-7e88639e58f6"
SECURITY_HEADERS="67f7725c-6f97-4210-82d7-5512b31e9d03"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok() { printf '  ✓ %s\n' "$*"; }

# GO54's panel takes the host relative to azapal.com.
go54_host() { printf '%s' "${1%.}" | sed 's/\.azapal\.com$//'; }

# ── Shared: certificate ──────────────────────────────────────────────────────

ensure_certificate() {
  say "Certificate: $CERT_DOMAIN, *.$CERT_DOMAIN ($CERT_REGION)"
  CERT_ARN="$(aws acm list-certificates --region "$CERT_REGION" \
    --certificate-statuses PENDING_VALIDATION ISSUED \
    --query "CertificateSummaryList[?DomainName=='$CERT_DOMAIN'].CertificateArn | [0]" --output text)"
  if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" = "None" ]; then
    CERT_ARN="$(aws acm request-certificate --region "$CERT_REGION" \
      --domain-name "$CERT_DOMAIN" --subject-alternative-names "*.$CERT_DOMAIN" \
      --validation-method DNS --idempotency-token partnerdash \
      --query CertificateArn --output text)"
    ok "requested $CERT_ARN"
  else
    ok "exists $CERT_ARN"
  fi
  aws acm add-tags-to-certificate --region "$CERT_REGION" --certificate-arn "$CERT_ARN" --tags \
    "Key=Name,Value=$CERT_DOMAIN" "Key=project,Value=$TAG_PROJECT" \
    "Key=stage,Value=shared" "Key=managed-by,Value=$TAG_MANAGED_BY" "Key=aws-apn-id,Value=$TAG_APN_ID"
  ok "tagged"

  # ACM takes a few seconds to publish the record it wants to see.
  local i
  VALIDATION_NAME="" VALIDATION_VALUE=""
  for i in $(seq 1 20); do
    read -r VALIDATION_NAME VALIDATION_VALUE < <(aws acm describe-certificate --region "$CERT_REGION" \
      --certificate-arn "$CERT_ARN" \
      --query 'Certificate.DomainValidationOptions[0].ResourceRecord.[Name,Value]' --output text) || true
    [ -n "$VALIDATION_NAME" ] && [ "$VALIDATION_NAME" != "None" ] && break
    sleep 3
  done

  CERT_STATUS="$(aws acm describe-certificate --region "$CERT_REGION" --certificate-arn "$CERT_ARN" \
    --query 'Certificate.Status' --output text)"
  ok "status $CERT_STATUS"
}

# ── Per stage ────────────────────────────────────────────────────────────────

ensure_bucket() {
  say "[$STAGE] S3 bucket: $BUCKET ($BUCKET_REGION)"
  if aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
    ok "exists"
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$BUCKET_REGION" \
      --create-bucket-configuration LocationConstraint="$BUCKET_REGION" >/dev/null
    ok "created"
  fi
  # Private, always. CloudFront reads it through Origin Access Control; nobody
  # reaches the bucket directly, so it can't serve a stale copy around the CDN.
  aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  aws s3api put-bucket-ownership-controls --bucket "$BUCKET" \
    --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
  aws s3api put-bucket-tagging --bucket "$BUCKET" --tagging "{\"TagSet\": [
    {\"Key\": \"Name\", \"Value\": \"$BUCKET\"},
    {\"Key\": \"project\", \"Value\": \"$TAG_PROJECT\"},
    {\"Key\": \"stage\", \"Value\": \"$STAGE\"},
    {\"Key\": \"domain\", \"Value\": \"$DOMAIN\"},
    {\"Key\": \"managed-by\", \"Value\": \"$TAG_MANAGED_BY\"},
    {\"Key\": \"aws-apn-id\", \"Value\": \"$TAG_APN_ID\"}]}"
  ok "private, owner-enforced, tagged"
}

ensure_oac() {
  local name="partner-dashboard-$STAGE"
  OAC_ID="$(aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='$name'].Id | [0]" --output text)"
  if [ -z "$OAC_ID" ] || [ "$OAC_ID" = "None" ]; then
    OAC_ID="$(aws cloudfront create-origin-access-control --origin-access-control-config \
      "{\"Name\": \"$name\", \"Description\": \"Partner dashboard $STAGE\", \"SigningProtocol\": \"sigv4\", \"SigningBehavior\": \"always\", \"OriginAccessControlOriginType\": \"s3\"}" \
      --query 'OriginAccessControl.Id' --output text)"
    ok "origin access control created $OAC_ID (CloudFront doesn't tag these)"
  else
    ok "origin access control exists $OAC_ID"
  fi
}

distribution_tags() {
  printf '{"Items": [
    {"Key": "Name", "Value": "partner-dashboard-%s"},
    {"Key": "project", "Value": "%s"},
    {"Key": "stage", "Value": "%s"},
    {"Key": "domain", "Value": "%s"},
    {"Key": "managed-by", "Value": "%s"},
    {"Key": "aws-apn-id", "Value": "%s"}]}' "$STAGE" "$TAG_PROJECT" "$STAGE" "$DOMAIN" "$TAG_MANAGED_BY" "$TAG_APN_ID"
}

ensure_distribution() {
  say "[$STAGE] CloudFront: $DOMAIN"
  local account
  account="$(aws sts get-caller-identity --query Account --output text)"
  DIST_ID="$(distribution_id_for "$DOMAIN")"
  if [ -n "$DIST_ID" ] && [ "$DIST_ID" != "None" ]; then
    ok "exists $DIST_ID"
    aws cloudfront tag-resource --resource "arn:aws:cloudfront::$account:distribution/$DIST_ID" \
      --tags "$(distribution_tags)"
    ok "tagged"
  else
    ensure_oac
    local origin="$BUCKET.s3.$BUCKET_REGION.amazonaws.com"
    local config
    # The 403/404 → /index.html rules are what make it a single-page app: a
    # deep link like /bills has no object behind it, S3 (through OAC) answers
    # 403, and CloudFront hands back the app, whose router takes it from there.
    config="$(cat <<JSON
{
  "DistributionConfig": {
    "CallerReference": "partner-dashboard-$STAGE-$(date +%s)",
    "Comment": "Partner dashboard ($STAGE)",
    "Enabled": true,
    "Aliases": {"Quantity": 1, "Items": ["$DOMAIN"]},
    "DefaultRootObject": "index.html",
    "Origins": {"Quantity": 1, "Items": [{
      "Id": "s3-$BUCKET",
      "DomainName": "$origin",
      "OriginAccessControlId": "$OAC_ID",
      "S3OriginConfig": {"OriginAccessIdentity": ""}
    }]},
    "DefaultCacheBehavior": {
      "TargetOriginId": "s3-$BUCKET",
      "ViewerProtocolPolicy": "redirect-to-https",
      "Compress": true,
      "CachePolicyId": "$CACHING_OPTIMIZED",
      "ResponseHeadersPolicyId": "$SECURITY_HEADERS",
      "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"],
        "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}}
    },
    "CustomErrorResponses": {"Quantity": 2, "Items": [
      {"ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 0},
      {"ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 0}
    ]},
    "ViewerCertificate": {
      "ACMCertificateArn": "$CERT_ARN",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "HttpVersion": "http2and3",
    "IsIPV6Enabled": true,
    "PriceClass": "PriceClass_All"
  },
  "Tags": $(distribution_tags)
}
JSON
)"
    DIST_ID="$(aws cloudfront create-distribution-with-tags --distribution-config-with-tags "$config" \
      --query 'Distribution.Id' --output text)"
    ok "created $DIST_ID, tagged (takes a few minutes to deploy worldwide)"
  fi

  aws s3api put-bucket-policy --bucket "$BUCKET" --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"CloudFrontReadsThroughOAC\",
      \"Effect\": \"Allow\",
      \"Principal\": {\"Service\": \"cloudfront.amazonaws.com\"},
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::$BUCKET/*\",
      \"Condition\": {\"StringEquals\": {\"AWS:SourceArn\": \"arn:aws:cloudfront::$account:distribution/$DIST_ID\"}}
    }]}"
  ok "bucket readable by this distribution only"

  DIST_DOMAIN="$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)"
}

# ── Run ──────────────────────────────────────────────────────────────────────

[ $# -eq 1 ] || { echo "usage: $(basename "$0") dev|staging|prod|all" >&2; exit 64; }
case "$1" in
  all) STAGES=(dev staging prod) ;;
  *) stage_settings "$1" >/dev/null; STAGES=("$1") ;;
esac

ensure_certificate
for s in "${STAGES[@]}"; do
  stage_settings "$s"
  ensure_bucket
done

if [ "$CERT_STATUS" != "ISSUED" ]; then
  say "Stopping before CloudFront: the certificate is $CERT_STATUS."
  if [ -n "$(dig +short CNAME "${VALIDATION_NAME%.}" @8.8.8.8)" ]; then
    echo "  GO54 is serving the validation record; ACM usually issues within minutes. Run this again shortly."
  else
    echo "  Add this at GO54 (DNS for azapal.com), then run this again once ACM has seen it:"
    echo
    echo "      CNAME   $(go54_host "$VALIDATION_NAME")"
    echo "        →     ${VALIDATION_VALUE%.}"
  fi
  exit 0
fi

CNAMES=()
for s in "${STAGES[@]}"; do
  stage_settings "$s"
  ensure_distribution
  CNAMES+=("$(go54_host "$DOMAIN")|$DIST_DOMAIN|$(dig +short CNAME "$DOMAIN" @8.8.8.8 | sed 's/\.$//')")
done

say "Done. Point each domain at its distribution with a CNAME at GO54:"
echo
for row in "${CNAMES[@]}"; do
  IFS='|' read -r host target current <<<"$row"
  if [ "$current" = "$target" ]; then
    printf '      ✓ %-18s CNAME  %s  (live)\n' "$host" "$target"
  else
    printf '        %-18s CNAME  %s\n' "$host" "$target"
  fi
done
echo
echo "  CloudFront has no fixed IP — always a CNAME, never an A record."
