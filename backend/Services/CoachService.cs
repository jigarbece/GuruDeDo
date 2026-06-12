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
        var items = await _db.SelectAsync<Coach>("coaches", query);

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

        var term = "%" + q.Trim().Replace("%", "\\%").Replace("_", "\\_") + "%";
        var termEnc = Uri.EscapeDataString(term);

        // 1. Category names that match.
        var cats = await _db.SelectAsync<Category>(
            "categories", $"name.ilike.{termEnc}&is_active=eq.true&select=name&limit=5");
        var catNames = cats.Select(c => c.Name).Where(n => !string.IsNullOrEmpty(n)).ToList();

        // 2. Collect sub_skills from coaches that contain the term in their skills text.
        //    We pull a batch and flatten client-side — avoids needing a DB function.
        var coaches = await _db.SelectAsync<Coach>(
            "coaches",
            $"select=sub_skills&status=eq.approved&sub_skills::text.ilike.{termEnc}&limit=50");

        var qLower = q.Trim().ToLowerInvariant();
        var skillSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var coach in coaches)
        {
            if (coach.SubSkills == null) continue;
            foreach (var skill in coach.SubSkills)
            {
                if (!string.IsNullOrWhiteSpace(skill) &&
                    skill.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    skillSet.Add(skill.Trim());
                }
            }
        }

        // Merge: category names first, then individual sub-skills, deduplicated.
        var results = catNames
            .Concat(skillSet.OrderBy(s => s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .ToList();

        return results;
    }

    // ---- Helpers --------------------------------------------------------------

    private static void AppendCommonFilters(List<string> filters, CoachQuery q)
    {
        var cityTrim = q.City?.Trim();
        var areaTrim = q.Area?.Trim();
        var locType  = q.LocationType?.Trim().ToLowerInvariant();

        if (!string.IsNullOrEmpty(cityTrim) && !string.IsNullOrEmpty(areaTrim) && locType == "area")
        {
            // User picked a specific area suggestion — filter city + area
            filters.Add($"city=ilike.{Uri.EscapeDataString(cityTrim)}");
            filters.Add($"area=ilike.{Uri.EscapeDataString("%" + areaTrim.Replace("%","\\%").Replace("_","\\_") + "%")}");
        }
        else if (!string.IsNullOrEmpty(cityTrim) && locType != "area")
        {
            // City-level — return all coaches in that city regardless of area
            filters.Add($"city=ilike.{Uri.EscapeDataString(cityTrim)}");
        }
        else if (!string.IsNullOrEmpty(areaTrim) && string.IsNullOrEmpty(cityTrim))
        {
            // Free-text with no city: search both city and area columns so
            // typing "Bopal" matches area=Bopal coaches AND typing "Ahmedabad"
            // matches city=Ahmedabad coaches even if city was sent as area.
            var areaPattern = Uri.EscapeDataString("%" + areaTrim.Replace("%","\\%").Replace("_","\\_") + "%");
            filters.Add($"or=(area.ilike.{areaPattern},city.ilike.{areaPattern})");
        }
        else if (!string.IsNullOrEmpty(cityTrim))
        {
            // City with no locationType — treat as city search
            filters.Add($"city=ilike.{Uri.EscapeDataString(cityTrim)}");
        }

        if (!string.IsNullOrWhiteSpace(q.CategoryId))
            filters.Add($"category_id=eq.{Uri.EscapeDataString(q.CategoryId)}");
        if (q.MinFee.HasValue)
            filters.Add($"fee_min=gte.{q.MinFee.Value}");
        if (q.MaxFee.HasValue)
            filters.Add($"fee_max=lte.{q.MaxFee.Value}");
        if (!string.IsNullOrWhiteSpace(q.TeachingMode) && q.TeachingMode != "all")
            filters.Add($"teaching_mode=in.({Uri.EscapeDataString(q.TeachingMode)},all)");
        if (q.DemoAvailable == true)
            filters.Add("demo_available=eq.true");
        if (q.Featured == true)
            filters.Add("featured=eq.true");
        if (!string.IsNullOrWhiteSpace(q.Skill))
        {
            var term    = "%" + q.Skill.Trim().Replace("%","\\%").Replace("_","\\_") + "%";
            var termEnc = Uri.EscapeDataString(term);
            filters.Add($"or=(sub_skills::text.ilike.{termEnc},bio.ilike.{termEnc},full_name.ilike.{termEnc})");
        }
    }

    private static string Esc(string value) => Uri.EscapeDataString(value);
}

/// <summary>Normalised query parameters for coach listing/search.</summary>
public class CoachQuery
{
    public string? Skill { get; set; }
    public string? Area { get; set; }
    public string? City { get; set; }          // null = no city filter
    public string? LocationType { get; set; }  // "city" | "area" | null
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
