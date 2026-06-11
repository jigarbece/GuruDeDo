namespace Gurudedo.API.Data;

/// <summary>
/// Phase 1 NOTE — data access intentionally goes through <c>SupabaseService</c>
/// (the Supabase PostgREST API over HttpClient), not Entity Framework Core.
///
/// Supabase already exposes a fully-featured REST layer with Row Level Security,
/// so for a read-mostly MVP a direct EF/Npgsql connection adds migrations,
/// connection-string management and a second source of truth for no real benefit.
///
/// This file is kept as the documented home for a future EF Core context if/when
/// Phase 2 needs richer transactional queries. To enable it:
///   1. dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
///   2. Define DbSet&lt;Coach&gt;, DbSet&lt;Category&gt;, DbSet&lt;Enquiry&gt; below.
///   3. Register with AddDbContext using the Supabase Postgres connection string.
/// </summary>
public static class AppDbContext
{
    public const string Note =
        "Phase 1 uses Supabase PostgREST via SupabaseService. See class summary for EF migration path.";
}
