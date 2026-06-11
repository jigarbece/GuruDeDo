using System.Text;
using System.Text.Json;

namespace Gurudedo.API.Services;

/// <summary>
/// Sends WhatsApp messages through the Meta Cloud API.
/// Phase 1 uses plain free-form text messages (no pre-approved templates) so we can
/// ship without waiting for template approval. Free-form messages only reach users who
/// have messaged the business number in the last 24h — for Phase 1 this is acceptable;
/// switch to approved templates in Phase 2.
/// </summary>
public class WhatsAppService
{
    private readonly HttpClient _http;
    private readonly ILogger<WhatsAppService> _logger;
    private readonly string _phoneNumberId;
    private readonly string _accessToken;
    private readonly string _apiVersion;
    private readonly string _publicSiteUrl;

    public bool IsConfigured { get; }

    public WhatsAppService(HttpClient http, IConfiguration config, ILogger<WhatsAppService> logger)
    {
        _http = http;
        _logger = logger;
        _phoneNumberId = config["WhatsApp:PhoneNumberId"] ?? "";
        _accessToken = config["WhatsApp:AccessToken"] ?? "";
        _apiVersion = config["WhatsApp:ApiVersion"] ?? "v18.0";
        _publicSiteUrl = (config["PublicSiteUrl"] ?? "https://gurudedo.com").TrimEnd('/');

        IsConfigured = !string.IsNullOrWhiteSpace(_phoneNumberId)
            && !_phoneNumberId.Contains("YOUR_")
            && !string.IsNullOrWhiteSpace(_accessToken)
            && !_accessToken.Contains("YOUR_");
    }

    // ---- Templates (plain text for Phase 1) ----------------------------------

    public Task SendRegistrationReceivedAsync(string toNumber, string name) =>
        SendTextAsync(toNumber,
            $"Namaste {name}! 🙏 Aapki Gurudedo profile successfully submit ho gayi hai. " +
            "Hum 24 ghante mein review karenge. " +
            "Koi sawal ho toh reply karein. " +
            "- Team Gurudedo 🎓");

    public Task SendApprovedAsync(string toNumber, string name, string coachId) =>
        SendTextAsync(toNumber,
            $"Badhaai ho {name}! 🎉 Aapki Gurudedo profile approved ho gayi! " +
            "Ab students aapko dhundh sakte hain. " +
            $"Profile dekhein: {_publicSiteUrl}/coach/{coachId} " +
            "- Team Gurudedo 🎓");

    public Task SendRejectedAsync(string toNumber, string name) =>
        SendTextAsync(toNumber,
            $"Namaste {name}. Aapki Gurudedo profile abhi approve nahi ho payi. " +
            "Kripya details dobara check karke phir se submit karein, ya humein reply karein. " +
            "- Team Gurudedo 🎓");

    public Task SendNewEnquiryAsync(string toNumber, string studentName, string skill, string area) =>
        SendTextAsync(toNumber,
            "Naya student enquiry! 📩\n" +
            $"Student: {studentName}\n" +
            $"Skill: {skill}\n" +
            $"Area: {area}\n" +
            "WhatsApp pe directly contact karein. " +
            "- Gurudedo 🎓");

    // ---- Core sender ----------------------------------------------------------

    /// <summary>Sends a free-form text message. Never throws — logs and returns on failure.</summary>
    public async Task SendTextAsync(string toNumber, string message)
    {
        var normalized = NormalizeIndianNumber(toNumber);

        if (!IsConfigured)
        {
            _logger.LogInformation("[WhatsApp:DRY-RUN] → {To}: {Message}", normalized, message);
            return;
        }

        try
        {
            var url = $"https://graph.facebook.com/{_apiVersion}/{_phoneNumberId}/messages";
            var payload = new
            {
                messaging_product = "whatsapp",
                recipient_type = "individual",
                to = normalized,
                type = "text",
                text = new { preview_url = true, body = message }
            };
            var req = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            req.Headers.Add("Authorization", $"Bearer {_accessToken}");

            var resp = await _http.SendAsync(req);
            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync();
                _logger.LogError("WhatsApp send to {To} failed ({Status}): {Body}",
                    normalized, (int)resp.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            // A messaging failure must never break the main request flow.
            _logger.LogError(ex, "WhatsApp send to {To} threw.", normalized);
        }
    }

    /// <summary>Strips non-digits and prefixes the India country code (91) when needed.</summary>
    private static string NormalizeIndianNumber(string raw)
    {
        var digits = new string(raw.Where(char.IsDigit).ToArray());
        if (digits.Length == 10) return "91" + digits;
        return digits;
    }
}
