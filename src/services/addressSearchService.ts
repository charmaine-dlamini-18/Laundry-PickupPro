export type AddressSuggestion = {
  id: string;
  formatted: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  lat: number;
  lon: number;
};

export async function searchAddresses(
  text: string
): Promise<AddressSuggestion[]> {
  const query = text.trim();

  if (query.length < 3) {
    return [];
  }

  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('Geoapify API key is missing.');
  }

  const params = new URLSearchParams({
    text: query,
    filter: 'countrycode:za',
    limit: '5',
    format: 'json',
    apiKey,
  });

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Unable to search for addresses.');
  }

  const data = await response.json();

  return (data.results ?? []).map((item: any) => ({
    id: item.place_id ?? item.datasource?.raw?.place_id ?? item.formatted,
    formatted: item.formatted ?? '',
    addressLine1: item.address_line1 ?? '',
    addressLine2: item.address_line2 ?? '',
    city: item.city ?? '',
    postcode: item.postcode ?? '',
    country: item.country ?? '',
    lat: item.lat ?? 0,
    lon: item.lon ?? 0,
  }));
}