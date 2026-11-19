const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.code = data?.error || 'REQUEST_FAILED';
    throw error;
  }

  return data;
}

export function getMovies() {
  return request('/movies');
}

export function createMovie(payload) {
  return request('/movies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMovie(id, payload) {
  return request(`/movies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteMovie(id) {
  return request(`/movies/${id}`, {
    method: 'DELETE',
  });
}

export function getRewatchOrder(id) {
  return request(`/movies/${id}/rewatch-order`);
}

export function getCinemas() {
  return request('/cinemas');
}

export function createCinema(payload) {
  return request('/cinemas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteCinema(id) {
  return request(`/cinemas/${id}`, {
    method: 'DELETE',
  });
}

export function getBookingQuote(cinemaId, groupSize) {
  const params = new URLSearchParams({ groupSize: String(groupSize) });
  return request(`/cinemas/${cinemaId}/booking?${params.toString()}`);
}

export function searchTmdb(query, type = 'multi') {
  const params = new URLSearchParams({ q: query, type });
  return request(`/tmdb/search?${params.toString()}`);
}

export function getTmdbDetails(type, tmdbId) {
  return request(`/tmdb/details/${type}/${tmdbId}`);
}
