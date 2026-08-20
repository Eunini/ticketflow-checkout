using TicketmasterCheckoutAssistant.Core.Models;

namespace TicketmasterCheckoutAssistant.Core.Contracts;

public interface IEventCatalog
{
    Task<IReadOnlyList<EventListing>> SearchAsync(
        EventSearchCriteria criteria,
        CancellationToken cancellationToken = default);
}
