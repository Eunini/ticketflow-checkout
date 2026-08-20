using TicketmasterCheckoutAssistant.Cli;
using TicketmasterCheckoutAssistant.Core;
using TicketmasterCheckoutAssistant.Infrastructure;

const string apiKeyEnvironmentVariable = "TICKETMASTER_API_KEY";

try
{
    var options = CliOptions.Parse(args);
    if (options.ShowHelp)
    {
        PrintHelp();
        return 0;
    }

    var apiKey = Environment.GetEnvironmentVariable(apiKeyEnvironmentVariable);
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        Console.Error.WriteLine(
            $"Missing {apiKeyEnvironmentVariable}. Set your Ticketmaster developer consumer key " +
            "as an environment variable before running the app.");
        return 2;
    }

    using var cancellationSource = new CancellationTokenSource();
    Console.CancelKeyPress += (_, eventArgs) =>
    {
        eventArgs.Cancel = true;
        cancellationSource.Cancel();
    };

    using var httpClient = new HttpClient
    {
        BaseAddress = new Uri("https://app.ticketmaster.com/"),
        Timeout = TimeSpan.FromSeconds(20)
    };
    httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
        "TicketmasterCheckoutAssistant/1.0 (+user-initiated-event-search)");

    var catalog = new TicketmasterDiscoveryClient(httpClient, apiKey);
    Console.WriteLine($"Searching for {options.Search!.Keyword} events...");
    var events = await catalog.SearchAsync(options.Search, cancellationSource.Token);

    if (events.Count == 0)
    {
        Console.WriteLine("No matching events were found.");
        return 0;
    }

    ConsoleEventPicker.Print(events);
    var selection = options.Selection ?? ConsoleEventPicker.Ask(events.Count);
    if (!selection.HasValue)
    {
        Console.WriteLine("No event selected.");
        return 0;
    }

    if (selection.Value < 1 || selection.Value > events.Count)
    {
        Console.Error.WriteLine($"Selection must be between 1 and {events.Count}.");
        return 2;
    }

    var selectedEvent = events[selection.Value - 1];
    Console.WriteLine();
    Console.WriteLine($"Opening Ticketmaster for: {selectedEvent.Name}");
    Console.WriteLine(selectedEvent.PurchaseUri);

    if (!BrowserLauncher.TryOpen(selectedEvent.PurchaseUri))
    {
        Console.WriteLine("Your browser could not be opened automatically. Copy the URL above instead.");
    }

    Console.WriteLine(
        "Complete seat selection, any queue or CAPTCHA, payment, and the final purchase in Ticketmaster.");
    return 0;
}
catch (OperationCanceledException)
{
    Console.Error.WriteLine("Cancelled.");
    return 130;
}
catch (ArgumentException exception)
{
    Console.Error.WriteLine(exception.Message);
    Console.Error.WriteLine("Run with --help for usage.");
    return 2;
}
catch (EventCatalogException exception)
{
    Console.Error.WriteLine(exception.Message);
    return 3;
}
catch (HttpRequestException exception)
{
    Console.Error.WriteLine($"Ticketmaster could not be reached: {exception.Message}");
    return 3;
}

static void PrintHelp() => Console.WriteLine(
    """
    Ticketmaster checkout assistant

    Searches Ticketmaster's public Discovery API, lists matching events, and opens the
    official event URL so the user can finish checkout on Ticketmaster.

    Usage:
      dotnet run --project src/TicketmasterCheckoutAssistant.Cli -- --keyword "artist or event" [options]

    Options:
      --keyword <text>   Event, artist, or venue to search for (required)
      --country <code>   Two-letter country code (default: US)
      --city <name>      Optional city filter
      --limit <1-20>     Maximum results to show (default: 10)
      --open <number>    Open a result directly; otherwise the app prompts
      --help, -h         Show this help

    Required environment variable:
      TICKETMASTER_API_KEY

    This app does not automate queues, CAPTCHA, seat holds, payment, or purchasing.
    """);
