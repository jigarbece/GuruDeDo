using Gurudedo.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gurudedo.API.Controllers;

/// <summary>
/// Utility endpoints for WhatsApp messaging. The send-test route is admin-protected
/// (it lives under /api/admin via the middleware? no — keep it explicit here) and is
/// handy for verifying Meta Cloud API credentials during setup.
/// </summary>
[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly WhatsAppService _whatsApp;
    private readonly AdminAuthService _auth;

    public NotificationsController(WhatsAppService whatsApp, AdminAuthService auth)
    {
        _whatsApp = whatsApp;
        _auth = auth;
    }

    public record TestMessage(string To, string Message);

    /// <summary>POST /api/notifications/test — send a free-form WhatsApp text (admin only).</summary>
    [HttpPost("test")]
    public async Task<IActionResult> SendTest([FromBody] TestMessage body)
    {
        // This route is not under /api/admin so guard it inline.
        var header = Request.Headers.Authorization.ToString();
        var token = header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? header["Bearer ".Length..].Trim() : null;
        if (!_auth.ValidateToken(token))
            return Unauthorized(new { error = "Admin token required." });

        if (string.IsNullOrWhiteSpace(body.To) || string.IsNullOrWhiteSpace(body.Message))
            return BadRequest(new { error = "Both 'to' and 'message' are required." });

        await _whatsApp.SendTextAsync(body.To, body.Message);
        return Ok(new { sent = true, configured = _whatsApp.IsConfigured });
    }
}
