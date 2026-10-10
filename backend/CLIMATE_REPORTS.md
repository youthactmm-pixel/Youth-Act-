# Community climate reports

## KoboToolbox connection

Configure these variables in the **backend** deployment environment (never in Vite or a `VITE_` variable):

- `KOBO_API_TOKEN`: private Kobo API token with read access to the form.
- `KOBO_ASSET_UID`: UID of the Kobo form asset.
- `KOBO_API_URL`: optional API host; defaults to `https://kf.kobotoolbox.org`.

The backend performs an initial sync and repeats every 60 seconds. The authenticated
`POST /api/admin/climate/sync` endpoint is also available for an immediate sync.
The sync reads Kobo's paginated submissions API, imports only issue type, township,
observation date, GPS, severity, and a text description, and does not persist raw
submissions, names, contact fields, or photographs. It accepts common Kobo field
names such as `gps`/`_geolocation`, `latitude`/`longitude`, `issue_type`, `township`,
`observation_date`, and `severity`.

Set `MONGO_URI` as required by the existing backend. New submissions are stored as
pending, not publicly visible. Kobo is an upstream input, not a moderation source:
an administrator must edit the public description to remove identifying details
and approve each report. The report is labelled verified only when the reviewer
explicitly marks it verified. Public map coordinates are rounded to three decimal
places (about 100 m).

## Public map and risk index

`GET /api/climate/reports` returns approved reports and GeoJSON risk polygons.
The map also refreshes its public data every 60 seconds. Reports are filterable by
township, issue, observation date, and severity.

The GIS layer is a report-derived 0.05-degree grid (~5 km): each approved report
contributes 1 point for low, 2 for moderate, 3 for high, or 4 for critical severity.
Cell totals of 1–3 are shown as watch, 4–7 as moderate, and 8 or more as high. The
grid is a transparent screening index only; it is not an official hazard map,
administrative boundary, or forecast. Risk assessment should be supported by local
knowledge and appropriate authoritative GIS datasets.

Administrators can review pending reports at `/#/admin/reports` after signing in.
Only the edited approved description and non-identifying map fields are returned
by the public endpoint. Photographs are not imported or displayed.
