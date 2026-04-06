export function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.BINDPLANE_API_KEY;
  const username = process.env.BINDPLANE_USERNAME;
  const password = process.env.BINDPLANE_PASSWORD;

  if (apiKey) {
    return { 'X-Bindplane-Api-Key': apiKey };
  }

  if (username) {
    if (!password) {
      throw new Error(
        'BINDPLANE_PASSWORD is required when BINDPLANE_USERNAME is set'
      );
    }
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }

  throw new Error(
    'No authentication configured. Set BINDPLANE_API_KEY or BINDPLANE_USERNAME + BINDPLANE_PASSWORD'
  );
}
