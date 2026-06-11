using Gurudedo.API.Services;

namespace Gurudedo.API.Middleware;

/// <summary>
/// Guards /api/admin/* routes with the admin JWT. The login route is exempt so a
/// password can be exchanged for a token. Everything else requires a valid Bearer token.
/// </summary>
public class AdminAuthMiddleware
{
    private readonly RequestDelegate _next;

    public AdminAuthMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, AdminAuthService auth)
    {
        var path = context.Request.Path.Value ?? "";

        var isAdminRoute = path.StartsWith("/api/admin", StringComparison.OrdinalIgnoreCase);
        var isLogin = path.StartsWith("/api/admin/login", StringComparison.OrdinalIgnoreCase);

        if (isAdminRoute && !isLogin)
        {
            var header = context.Request.Headers.Authorization.ToString();
            var token = header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? header["Bearer ".Length..].Trim()
                : null;

            if (!auth.ValidateToken(token))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"Unauthorized — admin token missing or invalid.\"}");
                return;
            }
        }

        await _next(context);
    }
}
