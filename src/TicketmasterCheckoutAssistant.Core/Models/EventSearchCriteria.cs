using System.Text.RegularExpressions;

namespace TicketmasterCheckoutAssistant.Core.Models;

public sealed partial record EventSearchCriteria
{
    private EventSearchCriteria(string keyword, string countryCode, string? city, int limit)
    {
        Keyword = keyword;
        CountryCode = countryCode;
        City = city;
        Limit = limit;
    }

    public string Keyword { get; }

    public string CountryCode { get; }

    public string? City { get; }

    public int Limit { get; }

    public static EventSearchCriteria Create(
        string keyword,
        string countryCode = "US",
        string? city = null,
        int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            throw new ArgumentException("A search keyword is required.", nameof(keyword));
        }

        var normalizedCountry = countryCode.Trim().ToUpperInvariant();
        if (!CountryCodePattern().IsMatch(normalizedCountry))
        {
            throw new ArgumentException(
                "The country must be a two-letter code such as US or GB.",
                nameof(countryCode));
        }

        if (limit is < 1 or > 20)
        {
            throw new ArgumentOutOfRangeException(nameof(limit), "The limit must be between 1 and 20.");
        }

        return new EventSearchCriteria(
            keyword.Trim(),
            normalizedCountry,
            string.IsNullOrWhiteSpace(city) ? null : city.Trim(),
            limit);
    }

    [GeneratedRegex("^[A-Z]{2}$", RegexOptions.CultureInvariant)]
    private static partial Regex CountryCodePattern();
}
