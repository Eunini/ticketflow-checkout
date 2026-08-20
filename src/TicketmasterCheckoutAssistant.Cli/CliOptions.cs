using System.Globalization;
using TicketmasterCheckoutAssistant.Core.Models;

namespace TicketmasterCheckoutAssistant.Cli;

public sealed record CliOptions(EventSearchCriteria? Search, int? Selection, bool ShowHelp)
{
    public static CliOptions Parse(string[] args)
    {
        if (args.Length == 0 || args.Any(value => value is "--help" or "-h"))
        {
            return new CliOptions(null, null, ShowHelp: true);
        }

        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < args.Length; index++)
        {
            var key = args[index];
            if (key is not ("--keyword" or "--country" or "--city" or "--limit" or "--open"))
            {
                throw new ArgumentException($"Unknown argument: {key}");
            }

            if (++index >= args.Length || args[index].StartsWith("--", StringComparison.Ordinal))
            {
                throw new ArgumentException($"Missing value for {key}.");
            }

            if (!values.TryAdd(key, args[index]))
            {
                throw new ArgumentException($"Argument supplied more than once: {key}");
            }
        }

        if (!values.TryGetValue("--keyword", out var keyword))
        {
            throw new ArgumentException("--keyword is required.");
        }

        var limit = ParseInteger(values, "--limit", 10);
        int? selection = values.ContainsKey("--open")
            ? ParseInteger(values, "--open", 0)
            : null;

        if (selection.HasValue && selection.Value <= 0)
        {
            throw new ArgumentException("--open must be a positive result number.");
        }

        var criteria = EventSearchCriteria.Create(
            keyword,
            values.GetValueOrDefault("--country", "US"),
            values.GetValueOrDefault("--city"),
            limit);

        return new CliOptions(criteria, selection, ShowHelp: false);
    }

    private static int ParseInteger(
        IReadOnlyDictionary<string, string> values,
        string key,
        int defaultValue)
    {
        if (!values.TryGetValue(key, out var rawValue))
        {
            return defaultValue;
        }

        if (!int.TryParse(rawValue, NumberStyles.None, CultureInfo.InvariantCulture, out var value))
        {
            throw new ArgumentException($"{key} must be a number.");
        }

        return value;
    }
}
