// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// // const authService = require("./src/services/user-auth.service");
// import { authService } from "./services";
// import { User } from "./models";
// import { IUser } from "./contracts/user.contract";


// // done: (error: any, user?: false | User  | null | undefined) => void;


// // Configure Google OAuth Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID || "",
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
//       callbackURL: "/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Check if the user already exists in the database
//         const  email = profile.emails?.[0].value;
//         if (!email) {
//           return done(new Error("Email is not available from Google"), false);
//         }
//         console.log("Google Profile : ", profile);
//         let user = await authService.findExistingEmail(email);
//         // let user = await User.findOne({profile.emails?.[0].value});
//         if (!user) {
//           // Create new user if not found
//           user = await new User({
//             firstName: profile.name?.givenName || "",
//             lastName: profile.name?.familyName || "",
//             email: email,
//             // password:User.prototype.hashPassword(password),
//             signUpThrough: "Google",
//           });
//           await user.save();
//         }
//         return done(null, user);
//       } catch (error) {
//         return done(error, false);
//       }
//     }
//   )
// );

// passport.serializeUser((user, done) => {
//   done(null, (user as IUser)._id);
// });

// passport.deserializeUser(async (id: string, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user || false);
//   } catch (error) {
//     done(error, false);
//   }
// });

// export default passport;
