using System.Globalization;
using System.Net;
using System.Text.Json;
using TicketmasterCheckoutAssistant.Core;
using TicketmasterCheckoutAssistant.Core.Contracts;
using TicketmasterCheckoutAssistant.Core.Models;
using TicketmasterCheckoutAssistant.Infrastructure.Transport;

namespace TicketmasterCheckoutAssistant.Infrastructure;

public sealed class TicketmasterDiscoveryClient : IEventCatalog
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public TicketmasterDiscoveryClient(HttpClient httpClient, string apiKey)
    {
        ArgumentNullException.ThrowIfNull(httpClient);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new ArgumentException("A Ticketmaster API key is required.", nameof(apiKey));
        }

        _httpClient = httpClient;
        _apiKey = apiKey;
    }

    public async Task<IReadOnlyList<EventListing>> SearchAsync(
        EventSearchCriteria criteria,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(criteria);

        var requestUri = BuildRequestUri(criteria);
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        using var response = await _httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new EventCatalogException(GetSafeError(response.StatusCode, response.ReasonPhrase));
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<DiscoveryResponse>(
            stream,
            JsonOptions,
            cancellationToken);

        return payload?.Embedded?.Events?
            .Select(MapEvent)
            .Where(item => item is not null)
            .Cast<EventListing>()
            .ToArray() ?? [];
    }

    private string BuildRequestUri(EventSearchCriteria criteria)
    {
        var parameters = new Dictionary<string, string?>
        {
            ["apikey"] = _apiKey,
            ["keyword"] = criteria.Keyword,
            ["countryCode"] = criteria.CountryCode,
            ["city"] = criteria.City,
            ["size"] = criteria.Limit.ToString(CultureInfo.InvariantCulture),
            ["sort"] = "date,asc"
        };

        var query = string.Join(
            "&",
            parameters
                .Where(pair => !string.IsNullOrWhiteSpace(pair.Value))
                .Select(pair => $"{WebUtility.UrlEncode(pair.Key)}={WebUtility.UrlEncode(pair.Value)}"));

        return $"discovery/v2/events.json?{query}";
    }

    private static EventListing? MapEvent(DiscoveryEvent source)
    {
        if (string.IsNullOrWhiteSpace(source.Id) ||
            string.IsNullOrWhiteSpace(source.Name) ||
            !Uri.TryCreate(source.Url, UriKind.Absolute, out var purchaseUri) ||
            purchaseUri.Scheme != Uri.UriSchemeHttps ||
            string.IsNullOrWhiteSpace(purchaseUri.Host))
        {
            return null;
        }

        DateOnly? localDate = DateOnly.TryParseExact(
            source.Dates?.Start?.LocalDate,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var parsedDate)
            ? parsedDate
            : null;

        TimeOnly? localTime = TimeOnly.TryParseExact(
            source.Dates?.Start?.LocalTime,
            "HH:mm:ss",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var parsedTime)
            ? parsedTime
            : null;

        var venue = source.Embedded?.Venues?.FirstOrDefault();
        var venueSummary = venue is null
            ? null
            : new VenueSummary(venue.Name, venue.City?.Name, venue.Country?.CountryCode);

        var price = source.PriceRanges?.FirstOrDefault();
        var priceSummary = price is null
            ? null
            : new PriceSummary(price.Currency, price.Minimum, price.Maximum);

        return new EventListing(
            source.Id,
            source.Name,
            purchaseUri,
            localDate,
            localTime,
            venueSummary,
            priceSummary);
    }

    private static string GetSafeError(HttpStatusCode statusCode, string? reasonPhrase) => statusCode switch
    {
        HttpStatusCode.Unauthorized => "The Ticketmaster API key was rejected.",
        HttpStatusCode.TooManyRequests => "Ticketmaster's API rate limit was reached. Try again later.",
        _ => $"Ticketmaster returned HTTP {(int)statusCode} ({reasonPhrase ?? "Unknown error"})."
    };
}
