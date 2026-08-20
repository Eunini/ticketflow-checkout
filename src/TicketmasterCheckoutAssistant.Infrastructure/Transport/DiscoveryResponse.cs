using System.Text.Json.Serialization;

namespace TicketmasterCheckoutAssistant.Infrastructure.Transport;

internal sealed record DiscoveryResponse(
    [property: JsonPropertyName("_embedded")] EventCollection? Embedded);

internal sealed record EventCollection(
    [property: JsonPropertyName("events")] IReadOnlyList<DiscoveryEvent>? Events);

internal sealed record DiscoveryEvent(
    [property: JsonPropertyName("id")] string? Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("url")] string? Url,
    [property: JsonPropertyName("dates")] DiscoveryDates? Dates,
    [property: JsonPropertyName("priceRanges")] IReadOnlyList<DiscoveryPriceRange>? PriceRanges,
    [property: JsonPropertyName("_embedded")] DiscoveryEventEmbedded? Embedded);

internal sealed record DiscoveryDates(
    [property: JsonPropertyName("start")] DiscoveryStart? Start);

internal sealed record DiscoveryStart(
    [property: JsonPropertyName("localDate")] string? LocalDate,
    [property: JsonPropertyName("localTime")] string? LocalTime);

internal sealed record DiscoveryEventEmbedded(
    [property: JsonPropertyName("venues")] IReadOnlyList<DiscoveryVenue>? Venues);

internal sealed record DiscoveryVenue(
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("city")] DiscoveryNamedValue? City,
    [property: JsonPropertyName("country")] DiscoveryCountry? Country);

internal sealed record DiscoveryNamedValue(
    [property: JsonPropertyName("name")] string? Name);

internal sealed record DiscoveryCountry(
    [property: JsonPropertyName("countryCode")] string? CountryCode);

internal sealed record DiscoveryPriceRange(
    [property: JsonPropertyName("currency")] string? Currency,
    [property: JsonPropertyName("min")] decimal Minimum,
    [property: JsonPropertyName("max")] decimal Maximum);
