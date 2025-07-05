import NextAuth from 'next-auth';
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  // Use MongoDB to store user accounts, sessions, etc.
  adapter: MongoDBAdapter(dbConnect().then(mongoose => mongoose.connection.getClient())),

  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        // Connect to the database
        await dbConnect();

        // Find the user by email
        const user = await User.findOne({ email: credentials.email });

        // If no user is found, or if the user has no password (e.g., signed up via OAuth)
        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        // Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error('Invalid credentials');
        }

        // Return user object if everything is correct
        return user;
      }
    })
  ],

  // Use JSON Web Tokens for session management
  session: {
    strategy: 'jwt',
  },

  // Secret for signing the JWT
  secret: process.env.NEXTAUTH_SECRET,

  // Callbacks are used to control what happens when an action is performed
  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // This callback is called whenever a session is checked.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'Student' | 'Admin';
      }
      return session;
    },
  },

  // Custom pages for sign-in, etc. We will create these later.
  pages: {
    signIn: '/auth/signin',
    // error: '/auth/error', // (optional)
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
