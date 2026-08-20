using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.RateLimiting;
using TicketmasterCheckoutAssistant.Core;
using TicketmasterCheckoutAssistant.Core.Models;
using TicketmasterCheckoutAssistant.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
builder.Services.AddHttpClient("ticketmaster", client =>
{
    client.BaseAddress = new Uri("https://app.ticketmaster.com/");
    client.Timeout = TimeSpan.FromSeconds(20);
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        "TicketFlow/1.0 (+user-initiated-event-search)");
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1),
                AutoReplenishment = true
            }));
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers.ContentSecurityPolicy =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self'; " +
        "img-src 'self' data:; " +
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
    await next();
});
app.UseRateLimiter();
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        context.Context.Response.Headers.CacheControl =
            context.File.Name.Contains('-', StringComparison.Ordinal)
                ? "public,max-age=31536000,immutable"
                : "public,max-age=300";
    }
});

app.MapGet("/health", (IConfiguration configuration) =>
{
    var configured = GetApiKey(configuration) is not null;
    return configured
        ? Results.Ok(new { status = "healthy", provider = "ticketmaster-discovery" })
        : Results.Json(
            new { status = "unhealthy", reason = "Ticketmaster API key is not configured." },
            statusCode: StatusCodes.Status503ServiceUnavailable);
}).ExcludeFromDescription();

app.MapGet("/api/events", async (
    string? keyword,
    string? country,
    string? city,
    int? limit,
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    CancellationToken cancellationToken) =>
{
    var apiKey = GetApiKey(configuration);
    if (apiKey is null)
    {
        return Results.Problem(
            title: "Live search is not configured",
            detail: "The Ticketmaster API credential has not been configured on this deployment.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    EventSearchCriteria criteria;
    try
    {
        criteria = EventSearchCriteria.Create(
            keyword ?? string.Empty,
            country ?? "US",
            city,
            limit ?? 12);
    }
    catch (ArgumentException exception)
    {
        return Results.Problem(
            title: "Invalid search",
            detail: exception.Message,
            statusCode: StatusCodes.Status400BadRequest);
    }

    try
    {
        var client = new TicketmasterDiscoveryClient(
            httpClientFactory.CreateClient("ticketmaster"),
            apiKey);
        var events = await client.SearchAsync(criteria, cancellationToken);
        return Results.Ok(new { events });
    }
    catch (EventCatalogException exception)
    {
        return Results.Problem(
            title: "Ticketmaster search failed",
            detail: exception.Message,
            statusCode: StatusCodes.Status502BadGateway);
    }
    catch (HttpRequestException)
    {
        return Results.Problem(
            title: "Ticketmaster is unavailable",
            detail: "The event provider could not be reached. Please try again shortly.",
            statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapFallbackToFile("index.html");
app.Run();

static string? GetApiKey(IConfiguration configuration)
{
    var value = configuration["TICKETMASTER_API_KEY"] ?? configuration["Ticketmaster:ApiKey"];
    return string.IsNullOrWhiteSpace(value) ? null : value;
}
