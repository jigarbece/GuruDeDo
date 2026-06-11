using System.Text.Json.Serialization;

namespace Gurudedo.API.Models;

/// <summary>Maps to the public.enquiries table (PostgREST snake_case).</summary>
public class Enquiry
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("coach_id")]
    public string? CoachId { get; set; }

    [JsonPropertyName("student_name")]
    public string? StudentName { get; set; }

    [JsonPropertyName("student_phone")]
    public string? StudentPhone { get; set; }

    [JsonPropertyName("skill_needed")]
    public string? SkillNeeded { get; set; }

    [JsonPropertyName("area")]
    public string? Area { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("source")]
    public string Source { get; set; } = "whatsapp_button";

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
}
