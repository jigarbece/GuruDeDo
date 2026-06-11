using System.Text.Json.Serialization;

namespace Gurudedo.API.Models;

/// <summary>Maps to the public.categories table (PostgREST snake_case).</summary>
public class Category
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonPropertyName("sort_order")]
    public int SortOrder { get; set; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
}
