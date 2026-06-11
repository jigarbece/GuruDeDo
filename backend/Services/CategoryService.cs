using Gurudedo.API.Models;

namespace Gurudedo.API.Services;

/// <summary>Reads categories and resolves slugs → ids for search filtering.</summary>
public class CategoryService
{
    private readonly SupabaseService _db;

    public CategoryService(SupabaseService db) => _db = db;

    public Task<List<Category>> GetAllAsync() =>
        _db.SelectAsync<Category>("categories", "is_active=eq.true&order=sort_order.asc");

    /// <summary>Returns the category id for a slug, or null if not found.</summary>
    public async Task<string?> ResolveIdFromSlugAsync(string slug)
    {
        var rows = await _db.SelectAsync<Category>("categories",
            $"select=id&slug=eq.{Uri.EscapeDataString(slug)}&limit=1");
        return rows.FirstOrDefault()?.Id;
    }
}
