'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/components/providers/AuthProvider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const Header = () => {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect to home page after sign out
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900/50 shadow-sm backdrop-blur-md sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Flashcard AI Pro</span>
          </Link>
        </div>
        <div className="flex items-center gap-x-6">
          {user ? (
            <>
              <Link href="/dashboard" className="hidden sm:block text-sm font-semibold leading-6 text-gray-900 dark:text-white">Dashboard</Link>
              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full overflow-hidden">
                    {user.photoURL ? (
                        <Image src={user.photoURL} alt="User profile" width={32} height={32} />
                    ) : (
                        <svg className="h-full w-full text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    )}
                  </div>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/profile" className={classNames(active ? 'bg-gray-100 dark:bg-gray-700' : '', 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200')}>Your Profile</Link>
                      )}
                    </Menu.Item>
                     <Menu.Item>
                      {({ active }) => (
                        <Link href="/dashboard" className={classNames(active ? 'bg-gray-100 dark:bg-gray-700' : '', 'block sm:hidden px-4 py-2 text-sm text-gray-700 dark:text-gray-200')}>Dashboard</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={handleSignOut} className={classNames(active ? 'bg-gray-100 dark:bg-gray-700' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200')}>Sign out</button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </>
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
