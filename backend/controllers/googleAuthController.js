import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const client = new OAuth2Client(
   process.env.GOOGLE_WEB_CLIENT_ID,
   process.env.GOOGLE_CLIENT_SECRET
);

// Helper: exchange authorization code for tokens
async function exchangeCodeForTokens(code, redirectUri) {
   const { tokens } = await client.getToken({
      code,
      redirect_uri: redirectUri,
   });
   return tokens;
}

// Helper: verify an ID token and return payload
async function verifyIdToken(idToken) {
   const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
   });
   return ticket.getPayload();
}

// @desc    Google Sign-In (login or register)
// @route   POST /api/users/google-signin
// @access  Public
// Accepts either { idToken } or { code, redirectUri }
export const googleSignIn = async (req, res) => {
   try {
      const { idToken, code, redirectUri } = req.body;

      console.log('[Backend Google Auth] Received request');
      console.log('[Backend Google Auth] idToken:', !!idToken, '| code:', !!code, '| redirectUri:', redirectUri);

      if (!idToken && !code) {
         return res.status(400).json({
            success: false,
            message: 'Google ID token or authorization code is required',
         });
      }

      let payload;
      try {
         if (code) {
            // Authorization code flow: exchange code for tokens, then verify
            console.log('[Backend Google Auth] Exchanging auth code for tokens...');
            const tokens = await exchangeCodeForTokens(code, redirectUri);
            console.log('[Backend Google Auth] Token exchange success. id_token exists:', !!tokens.id_token);
            payload = await verifyIdToken(tokens.id_token);
         } else {
            // Direct ID token flow (fallback)
            console.log('[Backend Google Auth] Verifying ID token directly...');
            payload = await verifyIdToken(idToken);
         }
      } catch (error) {
         console.error('[Backend Google Auth] Token verification failed:', error.message);
         return res.status(401).json({
            success: false,
            message: 'Invalid Google token: ' + error.message,
         });
      }

      const { sub: googleId, email, name, picture } = payload;

      console.log('[Backend Google Auth] Token verified. Google payload:');
      console.log('  - googleId:', googleId);
      console.log('  - email:', email);
      console.log('  - name:', name);
      console.log('  - picture:', picture ? 'exists' : 'none');

      if (!email) {
         return res.status(400).json({
            success: false,
            message: 'Email not available from Google account',
         });
      }

      // Try to find user by googleId first
      let user = await User.findOne({ googleId });

      if (user) {
         // Existing Google user — update profile info if changed
         let needsUpdate = false;
         if (name && user.name !== name) {
            user.name = name;
            needsUpdate = true;
         }
         if (picture && user.profilePicture !== picture) {
            user.profilePicture = picture;
            needsUpdate = true;
         }

         if (needsUpdate) {
            await user.save();
         }

         // Generate and persist access token atomically
         const token = await user.saveAccessToken();

         return res.status(200).json({
            success: true,
            message: 'Logged in with Google successfully',
            data: {
               user: formatUserResponse(user),
               token,
               isNewUser: false,
            },
         });
      }

      // Try to find user by email (account linking)
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
         // Link Google account to existing local user
         user.googleId = googleId;
         user.authProvider = 'google';
         if (picture && !user.profilePicture) {
            user.profilePicture = picture;
         }
         if (name && !user.name) {
            user.name = name;
         }
         await user.save();

         // Generate and persist access token atomically
         const token = await user.saveAccessToken();

         return res.status(200).json({
            success: true,
            message: 'Google account linked and logged in successfully',
            data: {
               user: formatUserResponse(user),
               token,
               isNewUser: false,
            },
         });
      }

      // No existing user — create new Google user
      user = await User.create({
         googleId,
         email: email.toLowerCase(),
         name: name || email.split('@')[0],
         profilePicture: picture || undefined,
         authProvider: 'google',
      });

      // Generate and persist access token atomically
      const token = await user.saveAccessToken();

      return res.status(201).json({
         success: true,
         message: 'Account created with Google successfully',
         data: {
            user: formatUserResponse(user),
            token,
            isNewUser: true,
         },
      });
   } catch (error) {
      console.error('Google Sign-In error:', error);
      res.status(500).json({
         success: false,
         message: 'Google Sign-In failed',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};

// Helper to format user response (exclude sensitive fields)
function formatUserResponse(user) {
   return {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      authProvider: user.authProvider,
      role: user.role || null,
      profilePicture: user.profilePicture,
      googleId: user.googleId ? true : undefined, // Don't expose actual googleId, just indicate it's linked
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
   };
}
