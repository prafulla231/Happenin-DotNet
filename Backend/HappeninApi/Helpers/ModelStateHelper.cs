using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace HappeninApi.Helpers
{
    public static class ModelStateHelper
    {
        public static Dictionary<string, string[]> ExtractErrors(ModelStateDictionary modelState)
        {
            return modelState
                .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );
        }
    }
}
