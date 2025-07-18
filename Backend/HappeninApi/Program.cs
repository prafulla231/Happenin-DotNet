using System;
using HappeninApi.DTOs;
using HappeninApi.Repositories;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;       
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc;


var builder = WebApplication.CreateBuilder(args);

// 1) Bind MongoSettings from appsettings.json
builder.Services.Configure<MongoSettings>(
    builder.Configuration.GetSection("MongoSettings"));
Console.WriteLine("MongoSettings bound from appsettings.json");

// 2) Register IMongoClient as a singleton
builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var opts = sp.GetRequiredService<IOptions<MongoSettings>>().Value;
    Console.WriteLine($"Connecting to MongoDB with connection string: {opts.ConnectionString}");
    return new MongoClient(opts.ConnectionString);
});

// 3) Register IMongoDatabase so you can inject it
builder.Services.AddScoped(sp =>
{
    var opts   = sp.GetRequiredService<IOptions<MongoSettings>>().Value;
    var client = sp.GetRequiredService<IMongoClient>();
    Console.WriteLine($"Getting database: {opts.DatabaseName}");
    return client.GetDatabase(opts.DatabaseName);
});

// 4) Register your repository
builder.Services.AddScoped<IEventRepository, EventRepository>();
Console.WriteLine("Repository registered");

builder.Services.AddControllers();
Console.WriteLine("Controllers registered");
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var provider = scope.ServiceProvider;
    try
    {
        // Resolve the scoped IMongoDatabase
        var db = provider.GetRequiredService<IMongoDatabase>();

        // Send the ping command
        var pingResult = db.RunCommand<BsonDocument>(new BsonDocument("ping", 1));

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"✅ MongoDB connected: {pingResult}");
        Console.ResetColor();
    }
    catch (Exception ex)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"❌ MongoDB connection failed: {ex.Message}");
        Console.ResetColor();
        // If you want the app to stop on failure, uncomment the next line:
        // throw;
    }
}

app.MapControllers();
Console.WriteLine("Controllers mapped");

app.Run();
