export function logMetric(
  name: string,
  value: number,
  tags: Record<string, string | number | boolean | null | undefined> = {}
) {
  const metricLog = {
    metric: name,
    value: value,
    timestamp: new Date().toISOString(),
    ...tags,
  };
  console.log(JSON.stringify(metricLog));
}
