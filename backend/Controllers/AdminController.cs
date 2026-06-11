using Gurudedo.API.Models.DTOs;
using Gurudedo.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gurudedo.API.Controllers;

/// <summary>
/// Admin moderation. Every route except /login is protected by AdminAuthMiddleware,
/// which validates the Bearer JWT before the request reaches this controller.
/// </summary>
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly CoachService _coaches;
    private readonly AdminAuthService _auth;

    public AdminController(CoachService coaches, AdminAuthService auth)
    {
        _coaches = coaches;
        _auth = auth;
    }

    /// <summary>POST /api/admin/login — verify the password, return a JWT.</summary>
    [HttpPost("login")]
    public IActionResult Login([FromBody] AdminLoginDto dto)
    {
        if (!_auth.VerifyPassword(dto.Password))
            return Unauthorized(new { error = "Galat password." });

        return Ok(new { token = _auth.IssueToken(), role = "admin" });
    }

    /// <summary>GET /api/admin/coaches/pending — pending registrations.</summary>
    [HttpGet("coaches/pending")]
    public async Task<IActionResult> Pending([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        => Ok(await _coaches.AdminListAsync("pending", page, pageSize));

    /// <summary>GET /api/admin/coaches/all — all coaches, filterable by status.</summary>
    [HttpGet("coaches/all")]
    public async Task<IActionResult> All(
        [FromQuery] string status = "all",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
        => Ok(await _coaches.AdminListAsync(status, page, pageSize));

    /// <summary>PUT /api/admin/coaches/{id}/approve — approve + WhatsApp the coach.</summary>
    [HttpPut("coaches/{id}/approve")]
    public async Task<IActionResult> Approve(string id)
    {
        var coach = await _coaches.SetStatusAsync(id, "approved");
        return coach is null ? NotFound(new { error = "Coach not found." }) : Ok(coach);
    }

    /// <summary>PUT /api/admin/coaches/{id}/reject — reject + WhatsApp the coach.</summary>
    [HttpPut("coaches/{id}/reject")]
    public async Task<IActionResult> Reject(string id)
    {
        var coach = await _coaches.SetStatusAsync(id, "rejected");
        return coach is null ? NotFound(new { error = "Coach not found." }) : Ok(coach);
    }

    /// <summary>PUT /api/admin/coaches/{id}/feature — toggle the featured flag.</summary>
    [HttpPut("coaches/{id}/feature")]
    public async Task<IActionResult> Feature(string id, [FromQuery] bool featured = true)
    {
        var coach = await _coaches.SetFeaturedAsync(id, featured);
        return coach is null ? NotFound(new { error = "Coach not found." }) : Ok(coach);
    }

    /// <summary>DELETE /api/admin/coaches/{id} — delete a coach.</summary>
    [HttpDelete("coaches/{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _coaches.DeleteAsync(id);
        return NoContent();
    }

    /// <summary>GET /api/admin/stats — dashboard totals.</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> Stats() => Ok(await _coaches.GetStatsAsync());
}
