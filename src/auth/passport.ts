import prisma from "@/utils/prisma";
import passport from "passport";
// import { OIDCStrategy } from "passport-azure-ad";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await prisma.user.findUnique({ where: { signUpId: id } });
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: "GOOGLE_CLIENT_ID",
      clientSecret: "GOOGLE_CLIENT_SECRET",
      callbackURL: "/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(null, false);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email,
              loginMethod: "GOOGLE",
              password: "",
              signUpId: profile.id.toString(),
              verificationCode: "checked",
            },
          });
        }

        return done(null, { ...user });
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);

// TODO: Habilitar o login com a Microsoft depois.
// passport.use(
//   new OIDCStrategy(
//     {
//       identityMetadata: `https://login.microsoftonline.com/<TENANT_ID>/v2.0/.well-known/openid-configuration`,
//       clientID: "MICROSOFT_CLIENT_ID",
//       clientSecret: "MICROSOFT_CLIENT_SECRET",
//       responseType: "code",
//       responseMode: "query",
//       redirectUrl: "http://localhost:3000/auth/microsoft/callback",
//       scope: ["profile", "email", "openid"],
//       passReqToCallback: false,
//     },

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     async (_i: any, _s: any, profile: any, _a: any, _r: any, done: any) => {
//       try {
//         const email = profile._json.preferred_username;
//         const name = (profile.displayName || profile.name) as string;

//         if (!email) return done(null, false);

//         let user = await prisma.user.findUnique({ where: { email } });

//         if (!user) {
//           user = await prisma.user.create({
//             data: {
//               name: name,
//               email,
//               loginMethod: "MICROSOFT",
//               password: "",
//               signUpId: profile.oid.toString(),
//               verificationCode: "checked",
//             },
//           });
//         }

//         return done(null, { ...user });
//       } catch (err) {
//         return done(err, false);
//       }
//     }
//   )
// );

export default passport;
