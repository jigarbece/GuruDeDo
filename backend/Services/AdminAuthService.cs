using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Gurudedo.API.Services;

/// <summary>Verifies the admin password and issues/validates a signed JWT.</summary>
public class AdminAuthService
{
    private const string Issuer = "gurudedo-api";
    private const string Audience = "gurudedo-admin";

    private readonly string _password;
    private readonly SymmetricSecurityKey _key;

    public AdminAuthService(IConfiguration config)
    {
        _password = config["Admin:Password"] ?? "gurudedo@admin123";

        var secret = config["Admin:JwtSecret"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32 || secret.Contains("YOUR_"))
            // Deterministic dev fallback so the API still boots without a configured secret.
            secret = "gurudedo-dev-only-jwt-secret-change-me-please-0123456789";

        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    public bool VerifyPassword(string password) =>
        !string.IsNullOrEmpty(password) &&
        string.Equals(password, _password, StringComparison.Ordinal);

    public string IssueToken(TimeSpan? lifetime = null)
    {
        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: new[] { new Claim(ClaimTypes.Role, "admin") },
            expires: DateTime.UtcNow.Add(lifetime ?? TimeSpan.FromDays(7)),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public bool ValidateToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;
        try
        {
            new JwtSecurityTokenHandler().ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = Issuer,
                ValidateAudience = true,
                ValidAudience = Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = _key,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            }, out _);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
