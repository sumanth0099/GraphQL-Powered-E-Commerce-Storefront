const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

/**
 * Lightweight GraphQL client — sends POST requests to the /graphql endpoint.
 * No Apollo, no Relay, no react-query.
 */
export async function graphqlQuery(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}
