export const encrypt = (qrContent: string, secretMessage: string) => {
  let result = "";

  if (secretMessage.length > qrContent.length) {
    qrContent = qrContent.padEnd(secretMessage.length, qrContent);
  } else {
    // qrContent = qrContent.slice(0, maxLength);
    qrContent = qrContent.slice(0, secretMessage.length);
  }

  // XOR each character code of both padded strings
  for (let i = 0; i < qrContent.length; i++) {
    const charCode1 = qrContent.charCodeAt(i);
    const charCode2 = secretMessage.charCodeAt(i);
    result += String.fromCharCode(charCode1 ^ charCode2);
  }

  return result;
};

export const decrypt = (encryptedMessage: string, qrContent: string) => {
  let result = "";
  let paddedQR = qrContent;

  //   check difference between encrypted message and qr content
  const maxLength = Math.max(encryptedMessage.length, qrContent.length);

  if (encryptedMessage.length > qrContent.length) {
    paddedQR = qrContent.padEnd(maxLength, qrContent);
  } else {
    paddedQR = qrContent.slice(0, maxLength);
  }

  // XOR to decrypt
  for (let i = 0; i < encryptedMessage.length; i++) {
    const charCode1 = encryptedMessage.charCodeAt(i);
    const charCode2 = paddedQR.charCodeAt(i);
    result += String.fromCharCode(charCode1 ^ charCode2);
  }

  return result;
};

// // Example usage
// const qrContent = "This is the visible QR content";
// const secretMessage = "This is the hidden message";
// const key = encrypt(qrContent, secretMessage);

// console.log("\nDecryption Test:");
// const decrypted = decrypt(key, qrContent);
// console.log("Decrypted secret:", decrypted);
