#!/usr/bin/env bash
set -euo pipefail

# http-latency.sh — tiny CURL-based latency tester with CSV + percentiles
# Usage:
#   ./http-latency.sh -n 50 -m POST \
#     -H "Authorization: Bearer ***" \
#     -d '"my-value"' \
#     -o upstash_times.csv \
#     https://example.com/set/my-key
#
# Flags:
#   -n   number of requests (default 30)
#   -m   HTTP method (default GET)
#   -H   header (repeatable)
#   -d   request body (optional)
#   -o   output CSV filename (default times.csv)
#
# Output:
#   1) CSV with columns: dns,connect,tls,ttfb,total
#   2) Summary: avg and p50/p95/p99 of total
#
# Notes:
#   - Uses curl timing vars: time_namelookup, time_connect, time_appconnect, time_starttransfer, time_total
#   - Keep sensitive tokens out of your shell history; prefer env vars for secrets.
#
num=30
method="GET"
declare -a headers=()
data=""
outfile="times.csv"
url=""

while getopts ":n:m:H:d:o:" opt; do
  case $opt in
    n) num="$OPTARG" ;;
    m) method="$OPTARG" ;;
    H) headers+=("-H" "$OPTARG") ;;
    d) data="$OPTARG" ;;
    o) outfile="$OPTARG" ;;
    \?) echo "Invalid option -$OPTARG" >&2; exit 1 ;;
  esac
done
shift $((OPTIND-1))

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 [-n num] [-m method] [-H header]... [-d data] [-o out.csv] URL" >&2
  exit 1
fi
url="$1"

# Prepare CSV header
echo "dns,connect,tls,ttfb,total" > "$outfile"

# Run the loop
for ((i=1;i<=num;i++)); do
  if [[ -n "$data" ]]; then
    curl -s -o /dev/null -X "$method" "${headers[@]}" -d "$data" \
      -w "%{time_namelookup},%{time_connect},%{time_appconnect},%{time_starttransfer},%{time_total}\n" \
      "$url" >> "$outfile"
  else
    curl -s -o /dev/null -X "$method" "${headers[@]}" \
      -w "%{time_namelookup},%{time_connect},%{time_appconnect},%{time_starttransfer},%{time_total}\n" \
      "$url" >> "$outfile"
  fi
done

# Compute averages for each column
avg_line=$(awk -F, 'NR>1 {dns+=$1;conn+=$2;tls+=$3;ttfb+=$4;tot+=$5;n++} END{if(n>0) printf "avg_dns=%.6f avg_conn=%.6f avg_tls=%.6f avg_ttfb=%.6f avg_total=%.6f\n", dns/n, conn/n, tls/n, ttfb/n, tot/n;}' "$outfile")

# Percentiles for total column
p50=$(awk -F, 'NR>1 {print $5}' "$outfile" | sort -n | awk '{arr[NR]=$1} END{if(NR==0){print "0"} else {idx=int(0.5*(NR+1)); if(idx<1) idx=1; print arr[idx]}}')
p95=$(awk -F, 'NR>1 {print $5}' "$outfile" | sort -n | awk '{arr[NR]=$1} END{if(NR==0){print "0"} else {idx=int(0.95*(NR)); if(idx<1) idx=1; print arr[idx]}}')
p99=$(awk -F, 'NR>1 {print $5}' "$outfile" | sort -n | awk '{arr[NR]=$1} END{if(NR==0){print "0"} else {idx=int(0.99*(NR)); if(idx<1) idx=1; print arr[idx]}}')

echo "wrote $outfile"
echo "$avg_line"
echo "p50_total=$p50 p95_total=$p95 p99_total=$p99"

# Pretty print a tiny summary row for quick copy/paste
awk -F, -v P50="$p50" -v P95="$p95" -v P99="$p99" '
  BEGIN{}
  END{printf("summary: avg_total=%s | p50=%s p95=%s p99=%s\n", "", P50, P95, P99)}
' "$outfile" >/dev/null

