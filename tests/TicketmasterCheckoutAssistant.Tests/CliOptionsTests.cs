using TicketmasterCheckoutAssistant.Cli;

namespace TicketmasterCheckoutAssistant.Tests;

public sealed class CliOptionsTests
{
    [Fact]
    public void Parse_NormalizesAValidSearch()
    {
        var options = CliOptions.Parse(
            ["--keyword", " Coldplay ", "--country", "gb", "--city", " London ", "--limit", "5"]);

        Assert.False(options.ShowHelp);
        var search = Assert.IsType<TicketmasterCheckoutAssistant.Core.Models.EventSearchCriteria>(
            options.Search);
        Assert.Equal("Coldplay", search.Keyword);
        Assert.Equal("GB", search.CountryCode);
        Assert.Equal("London", search.City);
        Assert.Equal(5, search.Limit);
    }

    [Theory]
    [InlineData("--unknown", "value")]
    [InlineData("--keyword", "event", "--limit", "21")]
    [InlineData("--keyword", "event", "--open", "0")]
    public void Parse_RejectsInvalidArguments(params string[] arguments)
    {
        Assert.ThrowsAny<ArgumentException>(() => CliOptions.Parse(arguments));
    }
}
