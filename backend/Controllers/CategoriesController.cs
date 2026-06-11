using Gurudedo.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gurudedo.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly CategoryService _categories;

    public CategoriesController(CategoryService categories) => _categories = categories;

    /// <summary>GET /api/categories — all active categories, ordered.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _categories.GetAllAsync();
        return Ok(categories);
    }
}
