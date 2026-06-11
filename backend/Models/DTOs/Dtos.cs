using System.ComponentModel.DataAnnotations;

namespace Gurudedo.API.Models.DTOs;

/// <summary>Body for POST /api/coaches/register.</summary>
public class CoachRegisterDto
{
    [Required] public string FullName { get; set; } = string.Empty;
    [Required] public string Phone { get; set; } = string.Empty;
    [Required] public string WhatsappNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string City { get; set; } = "Ahmedabad";
    [Required] public string Area { get; set; } = string.Empty;
    public string? Pincode { get; set; }
    [Required] public string CategoryId { get; set; } = string.Empty;
    public string[] SubSkills { get; set; } = Array.Empty<string>();
    public int ExperienceYears { get; set; }
    public int FeeMin { get; set; }
    public int FeeMax { get; set; }
    public string FeeType { get; set; } = "monthly";
    public string TeachingMode { get; set; } = "home_visit";
    public bool DemoAvailable { get; set; } = true;
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public string[] Languages { get; set; } = Array.Empty<string>();
}

/// <summary>Body for POST /api/coaches/{id}/enquiry.</summary>
public class EnquiryDto
{
    public string? StudentName { get; set; }
    public string? StudentPhone { get; set; }
    public string? SkillNeeded { get; set; }
    public string? Area { get; set; }
    public string? Message { get; set; }
    public string Source { get; set; } = "whatsapp_button";
}

/// <summary>Body for POST /api/admin/login.</summary>
public class AdminLoginDto
{
    [Required] public string Password { get; set; } = string.Empty;
}

/// <summary>Aggregate stats for the admin dashboard.</summary>
public class AdminStatsDto
{
    public int TotalCoaches { get; set; }
    public int Pending { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
    public int EnquiriesToday { get; set; }
}

/// <summary>Standard paged list envelope.</summary>
public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Array.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
}
