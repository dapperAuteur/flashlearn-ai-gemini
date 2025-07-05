'use client';

import { signOut } from 'next-auth/react';

export const SignOutButton = () => {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-sm font-semibold leading-6 text-gray-900 dark:text-white"
    >
      Sign Out
    </button>
  );
};
