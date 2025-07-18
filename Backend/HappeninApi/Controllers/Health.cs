using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Threading.Tasks;
using MongoDB.Bson;

namespace HappeninApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IMongoDatabase _db;

        public HealthController(IMongoDatabase db)
        {
            _db = db;
        }

        // [HttpGet("ping")]
        // public async Task<IActionResult> Ping()
        // {
        //     // Run the low‑level ping command
        //     var cmd = new BsonDocument("ping", 1);
        //     var result = await _db.RunCommandAsync<BsonDocument>(cmd);
        //     return Ok(result.ToJson());
        // }

        [HttpGet("ping")]
public IActionResult Ping()
{
    return Ok(new { status = "alive" });
}

    }
}
