        // ...existing code...

       
using HappeninApi.Models;
using MongoDB.Driver;
using HappeninApi.DTOs;
using HappeninApi.Helpers;

namespace HappeninApi.Repositories
{
    /// <summary>
    /// Repository for managing Event entities in MongoDB.
    /// Provides CRUD operations and queries for events.
    /// </summary>
    public class EventRepository : IEventRepository
    {
        private readonly IMongoCollection<Event> _events;

        /// <summary>
        /// Initializes a new instance of the <see cref="EventRepository"/> class.
        /// </summary>
        /// <param name="db">The MongoDB database instance.</param>
        public EventRepository(IMongoDatabase db)
        {
            _events = db.GetCollection<Event>("Events");
        }

        /// <summary>
        /// Creates a new event in the database.
        /// </summary>
        /// <param name="evnt">The event to create.</param>
        /// <returns>The created event.</returns>
        public async Task<Event> CreateEventAsync(Event evnt)
        {
            await _events.InsertOneAsync(evnt);
            return evnt;
        }

        /// <summary>
        /// Retrieves an event by its unique identifier.
        /// </summary>
        /// <param name="id">The event's unique identifier.</param>
        /// <returns>The event if found; otherwise, null.</returns>
        public async Task<Event?> GetByIdAsync(Guid id)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, id);
            return await _events.Find(filter).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Retrieves events by their status with pagination.
        /// </summary>
        /// <param name="status">The status to filter events by.</param>
        /// <param name="pagination">Pagination parameters.</param>
        /// <returns>A tuple containing the events and the total count.</returns>
        public async Task<(IEnumerable<Event> Events, int TotalCount)> GetEventsByStatusAsync(EventStatus status, PaginationHelper pagination)
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Eq(e => e.Status, status),
                Builders<Event>.Filter.Eq(e => e.IsDeleted, false)
            );

            var totalCount = (int)await _events.CountDocumentsAsync(filter);

            var events = await _events
                .Find(filter)
                .Skip(pagination.Skip)
                .Limit(pagination.Take)
                .SortByDescending(e => e.CreatedAt)
                .ToListAsync();

            return (events, totalCount);
        }
         /// <summary>
        /// Retrieves events by organizer and status with pagination.
        /// </summary>
        /// <param name="organizerId">The organizer's unique identifier.</param>
        /// <param name="status">The status to filter events by.</param>
        /// <param name="pagination">Pagination parameters.</param>
        /// <returns>A tuple containing the events and the total count.</returns>
        public async Task<(IEnumerable<Event> Events, int TotalCount)> GetEventsByOrganizerAndStatusAsync(Guid organizerId, EventStatus status, PaginationHelper pagination)
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Eq(e => e.CreatedById, organizerId),
                Builders<Event>.Filter.Eq(e => e.Status, status),
                Builders<Event>.Filter.Eq(e => e.IsDeleted, false)
            );

            var totalCount = (int)await _events.CountDocumentsAsync(filter);

            var events = await _events
                .Find(filter)
                .Skip(pagination.Skip)
                .Limit(pagination.Take)
                .SortByDescending(e => e.CreatedAt)
                .ToListAsync();

            return (events, totalCount);
        }

        /// <summary>
        /// Retrieves all non-deleted events with pagination.
        /// </summary>
        /// <param name="pagination">Pagination parameters.</param>
        /// <returns>A tuple containing the events and the total count.</returns>
        public async Task<(IEnumerable<Event> Events, int TotalCount)> GetAllEventsAsync(PaginationHelper pagination)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.IsDeleted, false);

            var totalCount = (int)await _events.CountDocumentsAsync(filter);

            var events = await _events
                .Find(filter)
                .Skip(pagination.Skip)
                .Limit(pagination.Take)
                .SortByDescending(e => e.CreatedAt)
                .ToListAsync();

            return (events, totalCount);
        }

        /// <summary>
        /// Retrieves events created by a specific organizer with pagination.
        /// </summary>
        /// <param name="organizerId">The organizer's unique identifier.</param>
        /// <param name="pagination">Pagination parameters.</param>
        /// <returns>A tuple containing the events and the total count.</returns>
        public async Task<(IEnumerable<Event> Events, int TotalCount)> GetEventsByOrganizerAsync(Guid organizerId, PaginationHelper pagination)
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Eq(e => e.CreatedById, organizerId),
                Builders<Event>.Filter.Eq(e => e.IsDeleted, false)
            );

            var totalCount = (int)await _events.CountDocumentsAsync(filter);

            var events = await _events
                .Find(filter)
                .Skip(pagination.Skip)
                .Limit(pagination.Take)
                .SortByDescending(e => e.CreatedAt)
                .ToListAsync();

            return (events, totalCount);
        }

        /// <summary>
        /// Marks events as expired if their date is in the past and they are not already expired.
        /// </summary>
        public async Task MarkExpiredEventsAsync()
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Lt(e => e.Date, DateTime.UtcNow),
                Builders<Event>.Filter.Ne(e => e.Status, EventStatus.Expired),
                Builders<Event>.Filter.Eq(e => e.IsDeleted, false)
            );

            var update = Builders<Event>.Update
                .Set(e => e.Status, EventStatus.Expired)
                .Set(e => e.UpdatedAt, DateTime.UtcNow);

            await _events.UpdateManyAsync(filter, update);
        }

        /// <summary>
        /// Updates the status of an event.
        /// </summary>
        /// <param name="id">The event's unique identifier.</param>
        /// <param name="newStatus">The new status to set.</param>
        /// <returns>True if the event was updated; otherwise, false.</returns>
        public async Task<bool> UpdateEventStatusAsync(Guid id, EventStatus newStatus)
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Eq(e => e.Id, id),
                Builders<Event>.Filter.Eq(e => e.IsDeleted, false)
            );

            var update = Builders<Event>.Update
                .Set(e => e.Status, newStatus)
                .Set(e => e.UpdatedAt, DateTime.UtcNow);

            var result = await _events.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        /// <summary>
        /// Soft deletes an event by setting its IsDeleted flag.
        /// </summary>
        /// <param name="id">The event's unique identifier.</param>
        /// <returns>True if the event was deleted; otherwise, false.</returns>
        public async Task<bool> DeleteEventAsync(Guid id)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, id);
            var update = Builders<Event>.Update
                .Set(e => e.IsDeleted, true)
                .Set(e => e.UpdatedAt, DateTime.UtcNow);

            var result = await _events.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        /// <summary>
        /// Updates an event's details.
        /// </summary>
        /// <param name="id">The event's unique identifier.</param>
        /// <param name="dto">The DTO containing updated event details.</param>
        /// <returns>True if the event was updated; otherwise, false.</returns>
        public async Task<bool> UpdateEventAsync(Guid id, UpdateEventDto dto)
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Eq(e => e.Id, id),
                Builders<Event>.Filter.Eq(e => e.IsDeleted, false)
            );

            var update = Builders<Event>.Update
                .Set(e => e.Title, dto.Title)
                .Set(e => e.Description, dto.Description)
                .Set(e => e.Date, dto.Date)
                .Set(e => e.TimeSlot, dto.TimeSlot)
                .Set(e => e.Duration, dto.Duration)
                .Set(e => e.LocationId, dto.LocationId)
                .Set(e => e.Category, dto.Category)
                .Set(e => e.Price, dto.Price)
                .Set(e => e.MaxRegistrations, dto.MaxRegistrations)
                .Set(e => e.Artist, dto.Artist)
                .Set(e => e.Organization, dto.Organization)
                .Set(e => e.UpdatedAt, DateTime.UtcNow);

            var result = await _events.UpdateOneAsync(filter, update);
            return result.MatchedCount > 0;
        }

        /// <summary>
        /// Retrieves all non-deleted events created by a specific organizer.
        /// </summary>
        /// <param name="organizerId">The organizer's unique identifier.</param>
        /// <returns>A list of events.</returns>
        public async Task<List<Event>> GetEventsByOrganizerIdAsync(Guid organizerId)
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Eq(e => e.CreatedById, organizerId),
                Builders<Event>.Filter.Eq(e => e.IsDeleted, false)
            );

            return await _events.Find(filter).ToListAsync();
        }

        /// <summary>
        /// Retrieves all non-deleted events.
        /// </summary>
        /// <returns>A list of events.</returns>
        public async Task<List<Event>> GetAllNonDeletedEventsAsync()
        {
            var filter = Builders<Event>.Filter.Eq(e => e.IsDeleted, false);
            return await _events.Find(filter).ToListAsync();
        }

    }
}