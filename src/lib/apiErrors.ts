import { NextResponse } from 'next/server';
import { DatabaseUnavailableError } from './db';

export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export function databaseErrorResponse(error: unknown, operation: string) {
  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error &&
    (typeof error.code === 'string' || typeof error.code === 'number')
      ? error.code
      : undefined;
  const errorName =
    typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string'
      ? error.name
      : 'UnknownError';
  const errorCodeName =
    typeof error === 'object' && error !== null && 'codeName' in error &&
    typeof error.codeName === 'string'
      ? error.codeName
      : errorCode === 13297
        ? 'DatabaseDifferCase'
        : undefined;

  console.error(
    `${operation} failed (${errorName}${errorCodeName ? `, ${errorCodeName}` : ''}${errorCode !== undefined ? `, code ${errorCode}` : ''}).`,
  );

  if (errorCode === 13297) {
    return NextResponse.json(
      {
        success: false,
        message: 'MongoDB rejected the selected database because a database with the same name but different letter casing already exists. Resolve the database-name conflict in Atlas before retrying.',
      },
      { status: 503 },
    );
  }

  if (error instanceof DatabaseUnavailableError || [
    'MongooseServerSelectionError',
    'MongoNetworkError',
    'MongoNetworkTimeoutError',
    'MongoNotConnectedError',
  ].includes(errorName)) {
    return NextResponse.json(
      { success: false, message: 'MongoDB is unavailable. Check the database configuration and try again.' },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: 'A server error occurred while processing the request. Please try again later.',
    },
    { status: 500 },
  );
}
