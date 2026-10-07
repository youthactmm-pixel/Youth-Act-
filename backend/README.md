# Backend configuration

The weather status page requests weather through `GET /api/weather`. Configure
`OPENWEATHER_API_KEY` as an environment variable on the backend host. For local
development, copy `env.example` to `.env` and add your key there. Keep the key
on the backend; do not expose it in frontend `VITE_` variables or commit it.

The weather endpoint uses OpenWeather's Current Weather and 5 Day / 3 Hour
Forecast APIs and returns metric units.
