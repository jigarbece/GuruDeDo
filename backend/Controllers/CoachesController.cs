using Gurudedo.API.Models.DTOs;
using Gurudedo.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gurudedo.API.Controllers;

[ApiController]
[Route("api/coaches")]
public class CoachesController : ControllerBase
{
    private readonly CoachService _coaches;
    private readonly CategoryService _categories;

    public CoachesController(CoachService coaches, CategoryService categories)
    {
        _coaches = coaches;
        _categories = categories;
    }

    /// <summary>GET /api/coaches — list approved coaches with filters + pagination.</summary>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? category,
        [FromQuery] string? area,
        [FromQuery] string? city,
        [FromQuery] string? locationType,
        [FromQuery(Name = "loc")] string[]? loc = null,
        [FromQuery] int? minFee = null,
        [FromQuery] int? maxFee = null,
        [FromQuery] string? teachingMode = null,
        [FromQuery] bool? demoAvailable = null,
        [FromQuery] bool? featured = null,
        [FromQuery] string? sort = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = await BuildQueryAsync(null, category, area, city, locationType, loc,
            minFee, maxFee, teachingMode, demoAvailable, featured, sort, page, pageSize);
        var result = await _coaches.ListAsync(query);
        return Ok(result);
    }

    /// <summary>GET /api/coaches/suggest?q=eng — skill/category suggestions for the search box.</summary>
    [HttpGet("suggest")]
    public async Task<IActionResult> Suggest([FromQuery] string? q, [FromQuery] int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<string>());
        var suggestions = await _coaches.SuggestSkillsAsync(q, Math.Clamp(limit, 1, 20));
        return Ok(suggestions);
    }

    /// <summary>GET /api/coaches/search — search by skill + multi-location + filters.</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? skill,
        [FromQuery] string? area,
        [FromQuery] string? category,
        [FromQuery] string? city,
        [FromQuery] string? locationType,
        [FromQuery(Name = "loc")] string[]? loc = null,
        [FromQuery] int? minFee = null,
        [FromQuery] int? maxFee = null,
        [FromQuery] string? teachingMode = null,
        [FromQuery] bool? demoAvailable = null,
        [FromQuery] string? sort = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = await BuildQueryAsync(skill, category, area, city, locationType, loc,
            minFee, maxFee, teachingMode, demoAvailable, null, sort, page, pageSize);
        var result = await _coaches.SearchAsync(query);
        return Ok(result);
    }

    /// <summary>GET /api/coaches/{id} — single public profile.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var coach = await _coaches.GetByIdAsync(id);
        return coach is null ? NotFound(new { error = "Coach not found." }) : Ok(coach);
    }

    /// <summary>POST /api/coaches/register — submit a registration (status=pending).</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CoachRegisterDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var error = ValidateRegistration(dto);
        if (error is not null) return BadRequest(new { error });

        var coach = await _coaches.RegisterAsync(dto);
        if (coach is null) return StatusCode(500, new { error = "Could not save registration." });

        return CreatedAtAction(nameof(Get), new { id = coach.Id }, coach);
    }

    /// <summary>POST /api/coaches/{id}/enquiry — log a WhatsApp click + notify the coach.</summary>
    [HttpPost("{id}/enquiry")]
    public async Task<IActionResult> Enquiry(string id, [FromBody] EnquiryDto dto)
    {
        var enquiry = await _coaches.LogEnquiryAsync(id, dto);
        return enquiry is null
            ? NotFound(new { error = "Coach not found." })
            : Ok(enquiry);
    }

    // ---- helpers --------------------------------------------------------------

    private async Task<CoachQuery> BuildQueryAsync(
        string? skill, string? categorySlug, string? area, string? city, string? locationType,
        string[]? locations,
        int? minFee, int? maxFee, string? teachingMode, bool? demoAvailable,
        bool? featured, string? sort, int page, int pageSize)
    {
        string? categoryId = null;
        if (!string.IsNullOrWhiteSpace(categorySlug))
            categoryId = await _categories.ResolveIdFromSlugAsync(categorySlug);

        return new CoachQuery
        {
            Skill = skill,
            Area = area,
            City = city,                  // null = no city filter (all cities)
            LocationType = locationType,  // "city" | "area" | null
            Locations = locations,        // multi-location filter (preferred path)
            CategoryId = categoryId,
            MinFee = minFee,
            MaxFee = maxFee,
            TeachingMode = teachingMode,
            DemoAvailable = demoAvailable,
            Featured = featured,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };
    }

    private static string? ValidateRegistration(CoachRegisterDto dto)
    {
        var digits = new string(dto.Phone.Where(char.IsDigit).ToArray());
        if (digits.Length is < 10 or > 12)
            return "Phone must be a valid 10-digit Indian number.";
        if (dto.SubSkills is null || dto.SubSkills.Length == 0)
            return "At least one sub-skill is required.";
        if (dto.FeeMin > dto.FeeMax)
            return "Fee minimum cannot exceed fee maximum.";
        if (string.IsNullOrWhiteSpace(dto.Bio) || dto.Bio.Trim().Length < 50)
            return "Bio must be at least 50 characters.";
        return null;
    }
}
