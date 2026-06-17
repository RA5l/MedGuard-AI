export function getUserFriendlyError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (typeof error === 'string') return error;

  const anyError = error as {
    message?: string;
    response?: { status?: number; data?: { detail?: string; message?: string } };
  };

  const detail = anyError?.response?.data?.detail ?? anyError?.response?.data?.message ?? anyError?.message;

  if (detail) return detail;

  if (anyError?.response?.status) {
    switch (anyError.response.status) {
      case 400:
        return 'The submitted information is incomplete or invalid.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You are not authorised to perform this action.';
      case 404:
        return 'The requested record could not be found.';
      case 409:
        return 'This action conflicts with an existing record.';
      case 422:
        return 'Please review the form fields and correct any invalid values.';
      case 500:
        return 'The server is unavailable right now. Please try again shortly.';
      default:
        break;
    }
  }

  return fallback;
}

export function getValidationMessage(field: string, reason: string) {
  const map: Record<string, string> = {
    email: 'Please enter a valid email address.',
    password: 'Password must be at least 8 characters.',
    case_code: 'Case code is required.',
    patient_alias: 'Patient alias must be a valid name.',
    date_of_birth: 'Please provide a valid date of birth.',
  };

  return map[field] ?? reason;
}
