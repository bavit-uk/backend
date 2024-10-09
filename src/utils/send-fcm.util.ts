import admin from "firebase-admin";
var serviceAccount = require("../../service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const sendFCM = async (message: admin.messaging.Message) => {
  try {
    await admin.messaging().send(message);
  } catch (error) {
    console.error(error);
  }
};
