using Gurudedo.API.Models;
using Gurudedo.API.Models.DTOs;

namespace Gurudedo.API.Services;

/// <summary>Business logic for coaches, search, enquiries and admin moderation.</summary>
public class CoachService
{
    private const string Embed = "*,categories(*)";
    private readonly SupabaseService _db;
    private readonly WhatsAppService _whatsApp;

    public CoachService(SupabaseService db, WhatsAppService whatsApp)
    {
        _db = db;
        _whatsApp = whatsApp;
    }

    // ---- Public read endpoints ------------------------------------------------

    /// <summary>Public listing of approved coaches with optional filters + pagination.</summary>
    public async Task<PagedResult<Coach>> ListAsync(CoachQuery q)
    {
        var filters = new List<string> { "status=eq.approved" };
        AppendCommonFilters(filters, q);

        var countFilter = string.Join("&", filters);
        var total = await _db.CountAsync("coaches", countFilter);

        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, 50);
        var offset = (page - 1) * pageSize;

        var order = q.Sort switch
        {
            "newest"   => "created_at.desc",
            "fee_asc"  => "fee_min.asc.nullslast",
            _          => "featured.desc,created_at.desc", // featured first (default)
        };

        var query = $"select={Embed}&{countFilter}&order={order}&offset={offset}&limit={pageSize}";
        List<Coach> items;
        try
        {
            items = await _db.SelectAsync<Coach>("coaches", query);
        }
        catch (HttpRequestException ex)
        {
            // Re-throw with the full query for easier debugging
            throw new HttpRequestException($"Coach query failed. Query: {query} | Error: {ex.Message}", ex);
        }

        return new PagedResult<Coach>
        {
            Items = items, Page = page, PageSize = pageSize, Total = total
        };
    }

    /// <summary>Search shares the same listing logic — skill maps to a sub_skills/name match.</summary>
    public Task<PagedResult<Coach>> SearchAsync(CoachQuery q) => ListAsync(q);

    public async Task<Coach?> GetByIdAsync(string id)
    {
        var rows = await _db.SelectAsync<Coach>("coaches",
            $"select={Embed}&id=eq.{Esc(id)}&limit=1");
        return rows.FirstOrDefault();
    }

    // ---- Registration ---------------------------------------------------------

    public async Task<Coach?> RegisterAsync(CoachRegisterDto dto)
    {
        var payload = new
        {
            full_name = dto.FullName,
            phone = dto.Phone,
            whatsapp_number = dto.WhatsappNumber,
            email = dto.Email,
            city = string.IsNullOrWhiteSpace(dto.City) ? "Ahmedabad" : dto.City,
            area = dto.Area,
            pincode = dto.Pincode,
            category_id = dto.CategoryId,
            sub_skills = dto.SubSkills,
            experience_years = dto.ExperienceYears,
            fee_min = dto.FeeMin,
            fee_max = dto.FeeMax,
            fee_type = dto.FeeType,
            teaching_mode = dto.TeachingMode,
            demo_available = dto.DemoAvailable,
            bio = dto.Bio,
            gender = dto.Gender,
            languages = dto.Languages,
            status = "pending"
        };

        var coach = await _db.InsertAsync<Coach>("coaches", payload);
        if (coach is not null)
            await _whatsApp.SendRegistrationReceivedAsync(coach.WhatsappNumber, coach.FullName);
        return coach;
    }

    // ---- Enquiries ------------------------------------------------------------

    public async Task<Enquiry?> LogEnquiryAsync(string coachId, EnquiryDto dto)
    {
        var coach = await GetByIdAsync(coachId);
        if (coach is null) return null;

        var payload = new
        {
            coach_id = coachId,
            student_name = dto.StudentName,
            student_phone = dto.StudentPhone,
            skill_needed = dto.SkillNeeded,
            area = dto.Area,
            message = dto.Message,
            source = string.IsNullOrWhiteSpace(dto.Source) ? "whatsapp_button" : dto.Source
        };

        var enquiry = await _db.InsertAsync<Enquiry>("enquiries", payload);

        await _whatsApp.SendNewEnquiryAsync(
            coach.WhatsappNumber,
            dto.StudentName ?? "Ek student",
            dto.SkillNeeded ?? (coach.SubSkills?.FirstOrDefault() ?? coach.Category?.Name ?? "skill"),
            dto.Area ?? coach.Area);

        return enquiry;
    }

    // ---- Admin moderation -----------------------------------------------------

    public async Task<PagedResult<Coach>> AdminListAsync(string? status, int page, int pageSize)
    {
        var filters = new List<string>();
        if (!string.IsNullOrWhiteSpace(status) && status != "all")
            filters.Add($"status=eq.{Esc(status)}");

        var countFilter = string.Join("&", filters);
        var total = await _db.CountAsync("coaches", countFilter);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var offset = (page - 1) * pageSize;

        var prefix = string.IsNullOrEmpty(countFilter) ? "" : $"{countFilter}&";
        var query = $"select={Embed}&{prefix}order=created_at.desc&offset={offset}&limit={pageSize}";
        var items = await _db.SelectAsync<Coach>("coaches", query);

        return new PagedResult<Coach> { Items = items, Page = page, PageSize = pageSize, Total = total };
    }

    public async Task<Coach?> SetStatusAsync(string id, string status)
    {
        var rows = await _db.UpdateAsync<Coach>("coaches", $"id=eq.{Esc(id)}",
            new { status });
        var coach = rows.FirstOrDefault();
        if (coach is null) return null;

        if (status == "approved")
            await _whatsApp.SendApprovedAsync(coach.WhatsappNumber, coach.FullName, coach.Id ?? id);
        else if (status == "rejected")
            await _whatsApp.SendRejectedAsync(coach.WhatsappNumber, coach.FullName);

        return coach;
    }

    public async Task<Coach?> SetFeaturedAsync(string id, bool featured)
    {
        var rows = await _db.UpdateAsync<Coach>("coaches", $"id=eq.{Esc(id)}", new { featured });
        return rows.FirstOrDefault();
    }

    public Task DeleteAsync(string id) => _db.DeleteAsync("coaches", $"id=eq.{Esc(id)}");

    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var today = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");
        return new AdminStatsDto
        {
            TotalCoaches    = await _db.CountAsync("coaches"),
            Pending         = await _db.CountAsync("coaches", "status=eq.pending"),
            Approved        = await _db.CountAsync("coaches", "status=eq.approved"),
            Rejected        = await _db.CountAsync("coaches", "status=eq.rejected"),
            EnquiriesToday  = await _db.CountAsync("enquiries", $"created_at=gte.{today}")
        };
    }

    // ---- Skill suggestions ----------------------------------------------------

    /// <summary>
    /// Returns up to <paramref name="limit"/> distinct skill suggestions whose text
    /// partially matches <paramref name="q"/> (case-insensitive).
    /// Searches: category names, and the sub_skills arrays of approved coaches.
    /// </summary>
    public async Task<List<string>> SuggestSkillsAsync(string q, int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 1)
            return new List<string>();

        var term    = "%" + q.Trim().Replace("%", "\\%").Replace("_", "\\_") + "%";
        var termEnc = Uri.EscapeDataString(term);

        // select= must come first in PostgREST query strings
        var cats = await _db.SelectAsync<Category>(
            "categories",
            $"select=name&is_active=eq.true&name=ilike.{termEnc}&limit=5");
        var catNames = cats.Select(c => c.Name).Where(n => !string.IsNullOrEmpty(n)).ToList();

        // sub_skills::text — keep :: unencoded; it is part of the column expression
        var coaches = await _db.SelectAsync<Coach>(
            "coaches",
            $"select=sub_skills&status=eq.approved&sub_skills=ilike.{termEnc}&limit=50");

        var skillSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var coach in coaches)
        {
            if (coach.SubSkills == null) continue;
            foreach (var skill in coach.SubSkills)
                if (!string.IsNullOrWhiteSpace(skill) &&
                    skill.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase))
                    skillSet.Add(skill.Trim());
        }

        return catNames
            .Concat(skillSet.OrderBy(s => s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .ToList();
    }

    // ---- Helpers --------------------------------------------------------------

    private static void AppendCommonFilters(List<string> filters, CoachQuery q)
    {
        var cityTrim = q.City?.Trim();
        var areaTrim = q.Area?.Trim();
        var locType  = q.LocationType?.Trim().ToLowerInvariant();

        // ── Location ─────────────────────────────────────────────────────────
        if (!string.IsNullOrEmpty(cityTrim) && !string.IsNullOrEmpty(areaTrim) && locType == "area")
        {
            // Specific area within a city
            filters.Add($"city=ilike.{Esc(cityTrim)}");
            filters.Add($"area=ilike.{Esc("%" + areaTrim + "%")}");
        }
        else if (!string.IsNullOrEmpty(cityTrim))
        {
            // City-level — all areas in that city
            filters.Add($"city=ilike.{Esc(cityTrim)}");
        }
        else if (!string.IsNullOrEmpty(areaTrim))
        {
            // Raw free-text — check both city and area columns.
            // IMPORTANT: only one or=() is allowed per PostgREST query.
            // We'll combine this with the skill or() below if needed.
            // Store separately so we can merge.
        }

        // ── Category / Fee / Mode / Demo / Featured ───────────────────────────
        if (!string.IsNullOrWhiteSpace(q.CategoryId))
            filters.Add($"category_id=eq.{Esc(q.CategoryId)}");
        if (q.MinFee.HasValue)
            filters.Add($"fee_min=gte.{q.MinFee.Value}");
        if (q.MaxFee.HasValue)
            filters.Add($"fee_max=lte.{q.MaxFee.Value}");
        if (!string.IsNullOrWhiteSpace(q.TeachingMode) && q.TeachingMode != "all")
            filters.Add($"teaching_mode=in.({Esc(q.TeachingMode)},all)");
        if (q.DemoAvailable == true)
            filters.Add("demo_available=eq.true");
        if (q.Featured == true)
            filters.Add("featured=eq.true");

        // ── Skill + optional free-text location (combined into one or=()) ────
        // PostgREST allows only ONE or= parameter per request.
        // Build all OR clauses together and emit a single or=(...).
        var orClauses = new List<string>();

        // Free-text location (no resolved city) — search both columns
        if (string.IsNullOrEmpty(cityTrim) && !string.IsNullOrEmpty(areaTrim))
        {
            var ap = Esc("%" + areaTrim + "%");
            orClauses.Add($"area.ilike.{ap}");
            orClauses.Add($"city.ilike.{ap}");
        }

        // Skill — search bio and full_name (text columns support ilike)
        if (!string.IsNullOrWhiteSpace(q.Skill))
        {
            var tp = Esc("%" + q.Skill.Trim() + "%");
            orClauses.Add($"bio.ilike.{tp}");
            orClauses.Add($"full_name.ilike.{tp}");
            // sub_skills: use cs (array contains) for exact match as well
            // cs is case-sensitive but at least finds exact matches
            var csVal = Esc("{" + q.Skill.Trim() + "}");
            orClauses.Add($"sub_skills.cs.{csVal}");
        }

        if (orClauses.Count > 0)
            filters.Add($"or=({string.Join(",", orClauses)})");
    }

    private static string Esc(string value) => Uri.EscapeDataString(value);
}

/// <summary>Normalised query parameters for coach listing/search.</summary>
public class CoachQuery
{
    public string? Skill { get; set; }
    public string? Area { get; set; }
    public string? City { get; set; }
    public string? LocationType { get; set; }
    public string? CategoryId { get; set; }
    public int? MinFee { get; set; }
    public int? MaxFee { get; set; }
    public string? TeachingMode { get; set; }
    public bool? DemoAvailable { get; set; }
    public bool? Featured { get; set; }
    public string? Sort { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}
