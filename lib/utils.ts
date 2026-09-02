export function formatDate(dateString: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  } catch (e) {
    return dateString;
  }
}

export function formatTime(timeString: string): string {
  return timeString; // Placeholder if needed
}
