using System.Net;
using System.Text;
using TicketmasterCheckoutAssistant.Core.Models;
using TicketmasterCheckoutAssistant.Infrastructure;

namespace TicketmasterCheckoutAssistant.Tests;

public sealed class TicketmasterDiscoveryClientTests
{
    [Fact]
    public async Task SearchAsync_MapsEventAndEncodesQuery()
    {
        Uri? capturedUri = null;
        var handler = new StubHttpMessageHandler(request =>
        {
            capturedUri = request.RequestUri;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(SuccessPayload, Encoding.UTF8, "application/json")
            };
        });
        using var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://app.ticketmaster.com/")
        };
        var client = new TicketmasterDiscoveryClient(httpClient, "test-key");

        var results = await client.SearchAsync(
            EventSearchCriteria.Create("Rock & Roll", "gb", "London", 5));

        var item = Assert.Single(results);
        Assert.Equal("event-1", item.Id);
        Assert.Equal("Sample Event", item.Name);
        Assert.Equal(new DateOnly(2027, 4, 5), item.LocalDate);
        Assert.Equal(new TimeOnly(19, 30), item.LocalTime);
        Assert.Equal("Sample Arena", item.Venue?.Name);
        Assert.Equal("https://www.ticketmaster.com/sample/event-1", item.PurchaseUri.AbsoluteUri);
        var requestUri = Assert.IsType<Uri>(capturedUri);
        Assert.Contains("keyword=Rock+%26+Roll", requestUri.Query);
        Assert.Contains("countryCode=GB", requestUri.Query);
        Assert.Contains("city=London", requestUri.Query);
        Assert.Contains("size=5", requestUri.Query);
    }

    [Fact]
    public async Task SearchAsync_DoesNotExposeApiKeyInErrors()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.Unauthorized));
        using var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://app.ticketmaster.com/")
        };
        var client = new TicketmasterDiscoveryClient(httpClient, "secret-test-key");

        var exception = await Assert.ThrowsAsync<TicketmasterCheckoutAssistant.Core.EventCatalogException>(() =>
            client.SearchAsync(EventSearchCriteria.Create("event")));

        Assert.DoesNotContain("secret-test-key", exception.Message);
    }

    private const string SuccessPayload = """
        {
          "_embedded": {
            "events": [
              {
                "id": "event-1",
                "name": "Sample Event",
                "url": "https://www.ticketmaster.com/sample/event-1",
                "dates": { "start": { "localDate": "2027-04-05", "localTime": "19:30:00" } },
                "priceRanges": [{ "currency": "GBP", "min": 40.00, "max": 120.00 }],
                "_embedded": {
                  "venues": [{
                    "name": "Sample Arena",
                    "city": { "name": "London" },
                    "country": { "countryCode": "GB" }
                  }]
                }
              }
            ]
          }
        }
        """;

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) => Task.FromResult(responder(request));
    }
}
