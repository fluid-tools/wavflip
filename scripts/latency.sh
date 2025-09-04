for i in {1..50}; do
  curl -s -o /dev/null -w '%{time_total}\n' \
    https://neat-molly-10465.upstash.io/set/my-key \
    -H "Authorization: Bearer ASjhAAIjcDFkYjljMjdhM2M3NGQ0NmU0YWRhMDQ3NTQzYWFkYTA2Y3AxMA" \
    -d '"my-value"'
done > times.txt

cat times.txt | awk '{sum+=$1; n++} END {print "avg:", sum/n}'
sort -n times.txt | awk 'NR==int(0.95*NR) {print "p95:", $1}'