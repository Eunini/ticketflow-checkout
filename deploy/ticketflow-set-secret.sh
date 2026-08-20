#!/bin/sh
set -eu

encoded_key=$(head -c 1024)
api_key=$(printf '%s' "$encoded_key" | base64 -d)

case "$api_key" in
  ''|*[!A-Za-z0-9_-]*)
    echo "Invalid Ticketmaster API key format." >&2
    exit 1
    ;;
esac

if [ "${#api_key}" -lt 16 ] || [ "${#api_key}" -gt 256 ]; then
  echo "Invalid Ticketmaster API key length." >&2
  exit 1
fi

umask 077
temporary_file=$(mktemp /etc/ticketflow-checkout.env.XXXXXX)
printf 'TICKETMASTER_API_KEY=%s\n' "$api_key" > "$temporary_file"
chown root:root "$temporary_file"
chmod 600 "$temporary_file"
mv "$temporary_file" /etc/ticketflow-checkout.env
systemctl restart ticketflow-checkout

attempt=0
while [ "$attempt" -lt 10 ]; do
  if curl -fsS http://127.0.0.1:5127/health >/dev/null; then
    echo "TicketFlow live search configured."
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 1
done

echo "TicketFlow did not become healthy after configuration." >&2
exit 1
