// AnalyticsController.cs
using HappeninApi.Models;
using HappeninApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace HappeninApi.Controllers
{
    /// <summary>
    /// Controller for analytics endpoints, providing event and registration statistics for organizers and admins.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IEventRepository _eventRepo;
        private readonly IRegistrationRepository _regRepo;

        public AnalyticsController(IEventRepository eventRepo, IRegistrationRepository regRepo)
        {
            _eventRepo = eventRepo;
            _regRepo = regRepo;
        }

        /// <summary>
        /// Returns analytics data for a specific organizer, including event counts, registrations, revenue, and breakdowns.
        /// </summary>
        /// <param name="id">Organizer's unique identifier</param>
        [HttpGet("organizer/{id}")]
        public async Task<IActionResult> GetOrganizerAnalytics(Guid id)
        {
            var events = await _eventRepo.GetEventsByOrganizerIdAsync(id);

            var currentDate = DateTime.UtcNow;
            var totalEvents = events.Count(e => !e.IsDeleted);
            var upcomingEvents = events.Count(e => e.Date >= currentDate && !e.IsDeleted);
            var expiredEvents = events.Count(e => e.Date < currentDate && !e.IsDeleted);

            var validEvents = events.Where(e => !e.IsDeleted).ToList();
            var eventIds = validEvents.Select(e => e.Id).ToList();
            var registrations = await _regRepo.GetByEventIdsAsync(eventIds);
            var totalRegistrations = registrations.Count;

            var eventsByCategory = validEvents
                .GroupBy(e => e.Category)
                .ToDictionary(g => g.Key, g => g.Count());

            var eventsByMonth = Enumerable.Range(0, 12)
                .Select(i => DateTime.UtcNow.AddMonths(-i))
                .Reverse()
                .ToDictionary(
                    d => d.ToString("yyyy MMM"),
                    d => validEvents.Count(e => e.Date.ToString("yyyy MMM") == d.ToString("yyyy MMM"))
                );

            var registrationsByEvent = validEvents.Select(ev => new EventCountDto
            {
                EventTitle = ev.Title,
                Registrations = registrations.Count(r => r.EventId == ev.Id)
            }).ToList();

            var revenueByEvent = validEvents.Select(ev => new EventRevenueDto
            {
                EventTitle = ev.Title,
                Revenue = registrations.Count(r => r.EventId == ev.Id) * ev.Price
            }).ToList();

            var data = new AnalyticsDataDto
            {
                TotalEvents = totalEvents,
                UpcomingEvents = upcomingEvents,
                ExpiredEvents = expiredEvents,
                TotalRegistrations = totalRegistrations,
                EventsByCategory = eventsByCategory,
                EventsByMonth = eventsByMonth,
                RegistrationsByEvent = registrationsByEvent,
                RevenueByEvent = revenueByEvent
            };

            return Ok(new { success = true, data });
        }

        /// <summary>
        /// Returns analytics data for admins, aggregating statistics across all events and registrations.
        /// </summary>
        [HttpGet("admin")]
        public async Task<IActionResult> GetAdminAnalytics()
        {
            var events = await _eventRepo.GetAllNonDeletedEventsAsync();

            var currentDate = DateTime.UtcNow;
            var totalEvents = events.Count(e => !e.IsDeleted);
            var upcomingEvents = events.Count(e => e.Date >= currentDate && !e.IsDeleted);
            var expiredEvents = events.Count(e => e.Date < currentDate && !e.IsDeleted);

            var validEvents = events.Where(e => !e.IsDeleted).ToList();
            var eventIds = validEvents.Select(e => e.Id).ToList();
            var registrations = await _regRepo.GetByEventIdsAsync(eventIds);
            var totalRegistrations = registrations.Count;

            var eventsByCategory = validEvents
                .GroupBy(e => e.Category)
                .ToDictionary(g => g.Key, g => g.Count());

            var eventsByMonth = Enumerable.Range(0, 12)
                .Select(i => DateTime.UtcNow.AddMonths(-i))
                .Reverse()
                .ToDictionary(
                    d => d.ToString("yyyy MMM"),
                    d => validEvents.Count(e => e.Date.ToString("yyyy MMM") == d.ToString("yyyy MMM"))
                );

            var registrationsByEvent = validEvents.Select(ev => new EventCountDto
            {
                EventTitle = ev.Title,
                Registrations = registrations.Count(r => r.EventId == ev.Id)
            }).ToList();

            var revenueByEvent = validEvents.Select(ev => new EventRevenueDto
            {
                EventTitle = ev.Title,
                Revenue = registrations.Count(r => r.EventId == ev.Id) * ev.Price
            }).ToList();

            var data = new AnalyticsDataDto
            {
                TotalEvents = totalEvents,
                UpcomingEvents = upcomingEvents,
                ExpiredEvents = expiredEvents,
                TotalRegistrations = totalRegistrations,
                EventsByCategory = eventsByCategory,
                EventsByMonth = eventsByMonth,
                RegistrationsByEvent = registrationsByEvent,
                RevenueByEvent = revenueByEvent
            };

            return Ok(new { success = true, data });
        }
    }
}
