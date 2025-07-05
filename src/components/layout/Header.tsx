import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SignOutButton } from '@/components/auth/SignOutButton';

export const Header = async () => {
  const session = await getServerSession(authOptions);

  return (
    <header className="bg-white dark:bg-gray-900/50 shadow-sm backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Flashcard AI Pro</span>
          </Link>
        </div>
        <div className="flex lg:flex-1 lg:justify-end">
          {session ? (
            <SignOutButton />
          ) : (
            <Link href="/auth/signin" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
              Sign In <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
