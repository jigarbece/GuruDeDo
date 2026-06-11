using Gurudedo.API.Middleware;
using Gurudedo.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- Environment variable overrides (Railway / Docker friendly) ---------------
// Map flat env vars onto the hierarchical config keys the services read.
var env = builder.Configuration;
void MapEnv(string envVar, string configKey)
{
    var value = Environment.GetEnvironmentVariable(envVar);
    if (!string.IsNullOrWhiteSpace(value)) env[configKey] = value;
}
MapEnv("SUPABASE_URL", "Supabase:Url");
MapEnv("SUPABASE_ANON_KEY", "Supabase:AnonKey");
MapEnv("SUPABASE_SERVICE_ROLE_KEY", "Supabase:ServiceRoleKey");
MapEnv("WHATSAPP_PHONE_NUMBER_ID", "WhatsApp:PhoneNumberId");
MapEnv("WHATSAPP_ACCESS_TOKEN", "WhatsApp:AccessToken");
MapEnv("WHATSAPP_API_VERSION", "WhatsApp:ApiVersion");
MapEnv("ADMIN_PASSWORD", "Admin:Password");
MapEnv("JWT_SECRET", "Admin:JwtSecret");
MapEnv("PUBLIC_SITE_URL", "PublicSiteUrl");

// ---- Services -----------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpClient<SupabaseService>();
builder.Services.AddHttpClient<WhatsAppService>();
builder.Services.AddScoped<CoachService>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddSingleton<AdminAuthService>();

// CORS — allow all origins for Phase 1 (locked down in config for production hosts).
const string CorsPolicy = "GurudedoCors";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        if (allowedOrigins.Length == 0)
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        else
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// ---- Pipeline -----------------------------------------------------------------
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors(CorsPolicy);

// Simple JWT gate for /api/admin/* (login exempt).
app.UseMiddleware<AdminAuthMiddleware>();

app.MapControllers();

// Health check for Railway.
app.MapGet("/health", () => Results.Ok(new { status = "healthy", app = "Gurudedo API" }));
app.MapGet("/", () => Results.Ok(new { app = "Gurudedo API", docs = "/swagger" }));

app.Run();
