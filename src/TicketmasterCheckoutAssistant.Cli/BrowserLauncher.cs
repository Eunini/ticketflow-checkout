using System.ComponentModel;
using System.Diagnostics;

namespace TicketmasterCheckoutAssistant.Cli;

internal static class BrowserLauncher
{
    public static bool TryOpen(Uri uri)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = uri.AbsoluteUri,
                UseShellExecute = true
            });
            return true;
        }
        catch (Exception exception) when (exception is InvalidOperationException or Win32Exception)
        {
            return false;
        }
    }
}
