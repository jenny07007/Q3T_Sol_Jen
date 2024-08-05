import { ActionError, ACTIONS_CORS_HEADERS } from "@solana/actions";

export function ErrorMessage(message: string, status: number) {
  const error: ActionError = {
    message,
  };
  return Response.json(error, {
    status: status,
    headers: ACTIONS_CORS_HEADERS,
  });
}
