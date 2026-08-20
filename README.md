# Ticketmaster checkout assistant

A clean .NET 8 project that searches Ticketmaster's public Discovery API,
shows matching events, and opens the selected event's official HTTPS purchase URL.
The customer completes the queue, seat choice, CAPTCHA (if present), payment, and
final purchase on Ticketmaster.

This repository is intentionally standalone. It has no dependency on Kami.

The client-facing web experience and its ASP.NET Core API are built and deployed
together. Event search uses live Discovery API data; no sample inventory is returned.

Production URL: <https://ticketflow.193.203.15.98.sslip.io>

## Safety and API boundary

The app does not automate checkout, evade queues or CAPTCHA, poll inventory, bypass
purchase limits, or collect payment credentials. Ticket reservation and purchase
are part of Ticketmaster's restricted Partner API and require an official
distribution agreement. Partners should implement that separately against the
contract and pre-production credentials Ticketmaster provides—not by scripting the
consumer website.

## Structure

```text
src/
  TicketmasterCheckoutAssistant.Core/            Domain records and contracts
  TicketmasterCheckoutAssistant.Infrastructure/  Ticketmaster Discovery API client
  TicketmasterCheckoutAssistant.Cli/             Arguments and console experience
  TicketmasterCheckoutAssistant.Web/             ASP.NET Core API and web host
tests/
  TicketmasterCheckoutAssistant.Tests/           Unit and HTTP-contract tests
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- A consumer key from the
  [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)

## Run

macOS/Linux:

```bash
export TICKETMASTER_API_KEY="your-consumer-key"
dotnet run --project src/TicketmasterCheckoutAssistant.Cli -- \
  --keyword "Coldplay" --country GB --city London
```

PowerShell:

```powershell
$env:TICKETMASTER_API_KEY = "your-consumer-key"
dotnet run --project src/TicketmasterCheckoutAssistant.Cli -- `
  --keyword "Coldplay" --country GB --city London
```

Choose a result when prompted. For an already reviewed result, `--open 1` opens the
first result without the prompt; it still never confirms a purchase.

## Build and test

```bash
dotnet restore
dotnet build --no-restore
dotnet test --no-build
```

Build the web frontend:

```bash
npm ci
npm run build
```

Build the production container:

```bash
docker build -t ticketflow-checkout .
docker run --rm -p 8080:8080 \
  -e TICKETMASTER_API_KEY="your-consumer-key" \
  ticketflow-checkout
```

The API key is required on the server. Never add it to source control, frontend
JavaScript, a Docker image, or a public GitHub Actions variable.

## Runtime configuration

Set `TICKETMASTER_API_KEY` in the deployment platform's encrypted secret store or
root-owned environment file. `/health` returns HTTP 503 until that value exists and
HTTP 200 once live Discovery search is configured.

The checked-in `deploy/` unit and Nginx files run the application as an isolated
systemd service on port `5127`; they contain no credentials.

The manual `Configure production` GitHub workflow can install the Ticketmaster key
through a forced-command SSH identity that has no shell, forwarding, or general sudo
access. The credential is validated and written to the root-only runtime environment
file without being printed.

## CLI options

```text
--keyword <text>   Event, artist, or venue to search for (required)
--country <code>   Two-letter country code (default: US)
--city <name>      Optional city filter
--limit <1-20>     Maximum results to show (default: 10)
--open <number>    Open a result directly; otherwise prompt
--help, -h         Show help
```
