export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json(data, {
    status: 200,
    ...init,
  });
}

export function jsonCreated<T>(data: T) {
  return Response.json(data, {
    status: 201,
  });
}

export function jsonError(
  error: string,
  code: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return Response.json(
    {
      error,
      code,
      ...extra,
    },
    { status },
  );
}
