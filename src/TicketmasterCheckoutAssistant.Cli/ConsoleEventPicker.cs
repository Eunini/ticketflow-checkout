using System.Globalization;
using TicketmasterCheckoutAssistant.Core.Models;

namespace TicketmasterCheckoutAssistant.Cli;

internal static class ConsoleEventPicker
{
    public static void Print(IReadOnlyList<EventListing> events)
    {
        Console.WriteLine();
        for (var index = 0; index < events.Count; index++)
        {
            var item = events[index];
            var date = item.LocalDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "Date TBA";
            var time = item.LocalTime?.ToString("HH:mm", CultureInfo.InvariantCulture);
            var when = string.IsNullOrWhiteSpace(time) ? date : $"{date} {time}";
            var where = JoinNonEmpty(item.Venue?.Name, item.Venue?.City, item.Venue?.CountryCode);
            var price = item.Price is null
                ? null
                : $"{item.Price.Currency} {item.Price.Minimum:0.##}-{item.Price.Maximum:0.##}".Trim();

            Console.WriteLine($"{index + 1,2}. {item.Name}");
            Console.WriteLine($"    {JoinNonEmpty(when, where, price)}");
        }
    }

    public static int? Ask(int eventCount)
    {
        Console.WriteLine();
        Console.Write($"Choose an event to open (1-{eventCount}), or press Enter to exit: ");
        var input = Console.ReadLine()?.Trim();
        if (string.IsNullOrEmpty(input))
        {
            return null;
        }

        if (!int.TryParse(input, NumberStyles.None, CultureInfo.InvariantCulture, out var selection))
        {
            throw new ArgumentException("The event selection must be a number.");
        }

        return selection;
    }

    private static string JoinNonEmpty(params string?[] values) => string.Join(
        " | ",
        values.Where(value => !string.IsNullOrWhiteSpace(value)));
}
