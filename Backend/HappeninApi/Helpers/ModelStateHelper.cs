using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace HappeninApi.Helpers
{

    /// <summary>
    /// Provides helper methods for extracting validation errors from model state.
    /// </summary>
    public static class ModelStateHelper
    {

        /// <summary>
        /// Extracts validation errors from the given <see cref="ModelStateDictionary"/>.
        /// </summary>
        /// <param name="modelState">The model state dictionary.</param>
        /// <returns>
        /// A dictionary mapping field names to arrays of error messages.
        /// </returns>
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
