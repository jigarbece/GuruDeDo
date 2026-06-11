using System.Text.Json.Serialization;

namespace Gurudedo.API.Models;

/// <summary>Maps to the public.coaches table (PostgREST snake_case).</summary>
public class Coach
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("whatsapp_number")]
    public string WhatsappNumber { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("city")]
    public string City { get; set; } = "Ahmedabad";

    [JsonPropertyName("area")]
    public string Area { get; set; } = string.Empty;

    [JsonPropertyName("pincode")]
    public string? Pincode { get; set; }

    [JsonPropertyName("category_id")]
    public string? CategoryId { get; set; }

    [JsonPropertyName("sub_skills")]
    public string[]? SubSkills { get; set; }

    [JsonPropertyName("experience_years")]
    public int ExperienceYears { get; set; }

    [JsonPropertyName("fee_min")]
    public int? FeeMin { get; set; }

    [JsonPropertyName("fee_max")]
    public int? FeeMax { get; set; }

    [JsonPropertyName("fee_type")]
    public string FeeType { get; set; } = "monthly";

    [JsonPropertyName("teaching_mode")]
    public string TeachingMode { get; set; } = "home_visit";

    [JsonPropertyName("demo_available")]
    public bool DemoAvailable { get; set; } = true;

    [JsonPropertyName("bio")]
    public string? Bio { get; set; }

    [JsonPropertyName("profile_photo_url")]
    public string? ProfilePhotoUrl { get; set; }

    [JsonPropertyName("teaching_photos")]
    public string[]? TeachingPhotos { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "pending";

    [JsonPropertyName("featured")]
    public bool Featured { get; set; }

    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [JsonPropertyName("languages")]
    public string[]? Languages { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Joined category (PostgREST embedded resource: ?select=*,categories(*))
    [JsonPropertyName("categories")]
    public Category? Category { get; set; }
}
