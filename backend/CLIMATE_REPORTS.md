# Community climate reports

## KoboToolbox connection

Configure these variables in the **backend** deployment environment (never in Vite or a `VITE_` variable):

- `KOBO_API_TOKEN`: private Kobo API token with read access to the form.
- `KOBO_ASSET_UID`: optional UID of the Kobo form asset; defaults to `asVctXHHGzNBbQ8smxu4Ro`.
- `KOBO_BASE_URL`: optional Kobo API host; defaults to `https://kf.kobotoolbox.org`.
  `KOBO_API_URL` is also accepted as a legacy alias.

The backend performs an initial sync and repeats every 60 seconds. The authenticated
`POST /api/admin/climate/sync` endpoint is also available for an immediate sync.
The sync reads Kobo's paginated submissions API, resolves individual “Section 3 —
Identify the problem” choice IDs to their Kobo labels, and imports only issue type,
township,
observation date, GPS, severity, a text description, image attachment metadata, and
photo-publication consent; it does not persist raw submissions, names, or contact
fields. All new submissions remain pending until a YouthAct administrator reviews
and approves them; Kobo validation status does not publish reports. Existing reports
keep their YouthAct moderation status, except older auto-published reports without
an administrator-approved description are returned to the pending review queue.
Public descriptions remain blank until an administrator edits and approves them in
YouthAct. It accepts common Kobo field
names such as `gps`/`_geolocation`, `latitude`/`longitude`, `issue_type`, `township`,
`observation_date`, and `severity`.

Set `MONGO_URI` as required by the existing backend. New reports appear in the
moderation queue after the next sync (within 60 seconds) or an authenticated manual
sync. Only reports with an administrator-approved description are returned publicly;
Kobo names, contacts, and source descriptions are not shown. A photo can be published
only when Kobo's photo-publication consent is affirmative and an administrator has
reviewed the image and explicitly allowed it. The report is labelled
verified only when an administrator explicitly marks it verified. Public map
coordinates are rounded to three decimal places (about 100 m).

## Kobo form detail page

The public detail page at `/#/kobo-form/asVctXHHGzNBbQ8smxu4Ro`
loads the form title, description, and question labels from Kobo. The backend
proxies this metadata through `GET /api/kobo/forms/:assetUid`; the Kobo token is
never sent to the browser. `KOBO_DETAIL_ASSET_UID` optionally overrides the form
UID (the page link and the default UID use `asVctXHHGzNBbQ8smxu4Ro`). The backend uses
`KOBO_API_TOKEN` and `KOBO_BASE_URL` for the request. A participation link is shown
only when the form is deployed and Kobo provides a deployment URL or identifier.
Requests using the previous detail-page UID `14afc072f186fd92a83fce2d2161c98897244df1`
are mapped to the current form for backwards compatibility.

Approved submissions imported from the configured Kobo asset are returned for
the detail page by `GET /api/kobo/forms/:assetUid/submissions`. Only approved,
public-safe observations are exposed; raw Kobo submissions and unapproved responses
remain private. If `KOBO_ASSET_UID` overrides the detail page's default asset UID,
it must match the form UID in the page URL for submissions to appear.

## Public map and risk index

`GET /api/climate/reports` returns approved reports and GeoJSON risk polygons.
The map also refreshes its public data every 60 seconds. Reports are filterable by township, individual issue choice, and severity.

The GIS layer is a report-derived 0.05-degree grid (~5 km): each approved report
contributes 1 point for low, 2 for moderate, 3 for high, or 4 for critical severity.
Cell totals of 1–3 are shown as watch, 4–7 as moderate, and 8 or more as high. The
grid is a transparent screening index only; it is not an official hazard map,
administrative boundary, or forecast. Risk assessment should be supported by local
knowledge and appropriate authoritative GIS datasets.

Administrators can review pending reports at `/#/admin/reports` after signing in.
Only the edited approved description, non-identifying map fields, and explicitly
approved images are returned by the public endpoint. Images are proxied by the
backend so Kobo attachment URLs and API credentials are never sent to the browser.
Administrators can permanently delete reports from the review queue. Deleted report
details and image references are removed from YouthAct, and a minimal Kobo submission
identifier is retained so a later sync does not import the deleted report again.

The climate page's "Share an observation" action opens the Kobo form at
`/#/kobo-form/asVctXHHGzNBbQ8smxu4Ro`. Import mapping uses this form's fields for
the observation date, township, issue location, environmental issue, severity,
and short description. New Kobo submissions enter the review queue and appear on
the public climate page only after an administrator approves them.
