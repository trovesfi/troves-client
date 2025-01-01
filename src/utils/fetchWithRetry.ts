async function fetchWithRetry(
  url: string,
  options: any = {},
  errorToast: string = 'Failed to fetch',
): Promise<Response | null> {
  const maxRetries = 3;
  const delay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      throw new Error(`Failed to fetch ${url}, ${response.statusText}`, {
        cause: response.status,
      });
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error(`Error fetching ${url} : `, error);
        // toast.error(errorToast, {
        //   position: 'bottom-right',
        // });
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return null;
}

export default fetchWithRetry;
