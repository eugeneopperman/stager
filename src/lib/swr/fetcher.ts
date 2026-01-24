/**
 * Standard fetcher functions for SWR
 */

/**
 * Standard JSON fetcher for GET requests
 */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object
    (error as Error & { info?: unknown; status?: number }).info =
      await response.json().catch(() => ({}));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * POST fetcher for mutations
 */
export async function postFetcher<T>(
  url: string,
  { arg }: { arg: Record<string, unknown> }
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const error = new Error("An error occurred while posting the data.");
    (error as Error & { info?: unknown; status?: number }).info =
      await response.json().catch(() => ({}));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * PATCH fetcher for updates
 */
export async function patchFetcher<T>(
  url: string,
  { arg }: { arg: Record<string, unknown> }
): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const error = new Error("An error occurred while patching the data.");
    (error as Error & { info?: unknown; status?: number }).info =
      await response.json().catch(() => ({}));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * DELETE fetcher for removals
 */
export async function deleteFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = new Error("An error occurred while deleting the data.");
    (error as Error & { info?: unknown; status?: number }).info =
      await response.json().catch(() => ({}));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}
