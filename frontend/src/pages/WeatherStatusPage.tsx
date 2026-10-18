import { Navigate, useSearchParams } from 'react-router-dom'

export default function WeatherStatusPage() {
  const [searchParams] = useSearchParams()
  const latitude = Number(searchParams.get('lat'))
  const longitude = Number(searchParams.get('lon'))
  const hasValidCoordinates =
    searchParams.has('lat') &&
    searchParams.has('lon') &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180

  // မမှန်ကန်သော coordinates ကိုရွေးချယ်မှုစာမျက်နှာသို့ပြန်ပို့ပြီး၊ မှန်လျှင် map သို့လွှဲသည်။
  if (!hasValidCoordinates) return <Navigate to="/yangon-weather" replace />
  return <Navigate to={`/community-map?${searchParams.toString()}`} replace />
}
