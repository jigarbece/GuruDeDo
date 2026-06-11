using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Gurudedo.API.Services;

/// <summary>
/// Thin wrapper over the Supabase PostgREST API (https://&lt;project&gt;.supabase.co/rest/v1).
/// The backend uses the service-role key so it can read/write every row (bypasses RLS).
/// </summary>
public class SupabaseService
{
    private readonly HttpClient _http;
    private readonly ILogger<SupabaseService> _logger;
    private readonly string _restUrl;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    public bool IsConfigured { get; }

    public SupabaseService(HttpClient http, IConfiguration config, ILogger<SupabaseService> logger)
    {
        _http = http;
        _logger = logger;

        var url = config["Supabase:Url"] ?? "";
        var serviceKey = config["Supabase:ServiceRoleKey"] ?? "";

        IsConfigured = !string.IsNullOrWhiteSpace(url)
            && !url.Contains("YOUR_SUPABASE")
            && !string.IsNullOrWhiteSpace(serviceKey)
            && !serviceKey.Contains("YOUR_SUPABASE");

        _restUrl = url.TrimEnd('/') + "/rest/v1";

        if (IsConfigured)
        {
            _http.DefaultRequestHeaders.Add("apikey", serviceKey);
            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", serviceKey);
            _http.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
        }
        else
        {
            _logger.LogWarning(
                "Supabase is not configured. Set Supabase:Url and Supabase:ServiceRoleKey in appsettings/.env.");
        }
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
            throw new InvalidOperationException(
                "Supabase credentials are missing. Configure Supabase:Url and Supabase:ServiceRoleKey.");
    }

    /// <summary>GET rows. <paramref name="query"/> is a raw PostgREST query string (no leading '?').</summary>
    public async Task<List<T>> SelectAsync<T>(string table, string query = "")
    {
        EnsureConfigured();
        var url = $"{_restUrl}/{table}" + (string.IsNullOrEmpty(query) ? "" : $"?{query}");
        var resp = await _http.GetAsync(url);
        var body = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
            throw new HttpRequestException($"Supabase SELECT {table} failed ({(int)resp.StatusCode}): {body}");
        return JsonSerializer.Deserialize<List<T>>(body, JsonOpts) ?? new List<T>();
    }

    /// <summary>Exact count of rows matching <paramref name="filter"/> using the count header.</summary>
    public async Task<int> CountAsync(string table, string filter = "")
    {
        EnsureConfigured();
        var url = $"{_restUrl}/{table}?select=id" + (string.IsNullOrEmpty(filter) ? "" : $"&{filter}");
        var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Add("Prefer", "count=exact");
        req.Headers.Range = new RangeHeaderValue(0, 0); // only need the header, not the body
        var resp = await _http.SendAsync(req);
        // Content-Range header looks like: "0-0/123"  →  total is after the slash
        string? contentRange = null;
        if (resp.Content.Headers.TryGetValues("Content-Range", out var cv))
            contentRange = string.Join("", cv);
        else if (resp.Headers.TryGetValues("Content-Range", out var hv))
            contentRange = string.Join("", hv);

        if (contentRange != null && contentRange.Contains('/'))
        {
            var totalPart = contentRange.Split('/').Last();
            if (int.TryParse(totalPart, out var total)) return total;
        }
        return 0;
    }

    /// <summary>INSERT a row and return the inserted record (Prefer: return=representation).</summary>
    public async Task<T?> InsertAsync<T>(string table, object payload)
    {
        EnsureConfigured();
        var json = JsonSerializer.Serialize(payload, JsonOpts);
        var req = new HttpRequestMessage(HttpMethod.Post, $"{_restUrl}/{table}")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        req.Headers.Add("Prefer", "return=representation");
        var resp = await _http.SendAsync(req);
        var body = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
            throw new HttpRequestException($"Supabase INSERT {table} failed ({(int)resp.StatusCode}): {body}");
        var rows = JsonSerializer.Deserialize<List<T>>(body, JsonOpts);
        return rows is { Count: > 0 } ? rows[0] : default;
    }

    /// <summary>PATCH rows matching <paramref name="filter"/> and return the updated record(s).</summary>
    public async Task<List<T>> UpdateAsync<T>(string table, string filter, object payload)
    {
        EnsureConfigured();
        var json = JsonSerializer.Serialize(payload, JsonOpts);
        var req = new HttpRequestMessage(HttpMethod.Patch, $"{_restUrl}/{table}?{filter}")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        req.Headers.Add("Prefer", "return=representation");
        var resp = await _http.SendAsync(req);
        var body = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
            throw new HttpRequestException($"Supabase UPDATE {table} failed ({(int)resp.StatusCode}): {body}");
        return JsonSerializer.Deserialize<List<T>>(body, JsonOpts) ?? new List<T>();
    }

    /// <summary>DELETE rows matching <paramref name="filter"/>.</summary>
    public async Task DeleteAsync(string table, string filter)
    {
        EnsureConfigured();
        var resp = await _http.DeleteAsync($"{_restUrl}/{table}?{filter}");
        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Supabase DELETE {table} failed ({(int)resp.StatusCode}): {body}");
        }
    }
}
