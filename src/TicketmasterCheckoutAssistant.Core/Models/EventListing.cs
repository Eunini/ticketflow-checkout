namespace TicketmasterCheckoutAssistant.Core.Models;

public sealed record EventListing(
    string Id,
    string Name,
    Uri PurchaseUri,
    DateOnly? LocalDate,
    TimeOnly? LocalTime,
    VenueSummary? Venue,
    PriceSummary? Price);

public sealed record VenueSummary(string? Name, string? City, string? CountryCode);

public sealed record PriceSummary(string? Currency, decimal Minimum, decimal Maximum);
