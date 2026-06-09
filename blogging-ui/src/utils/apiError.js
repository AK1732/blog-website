export function getApiErrorMessage(err, fallback = 'Request failed') {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

