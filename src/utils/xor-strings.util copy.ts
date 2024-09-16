/**
 * XORs two input strings to generate a key that can be used to decrypt data given the key
 *
 * @remarks
 * This method is part of the `utils` module.
 *
 * @param s1 - The first input string that will be treated as a key
 * @param s2 - The second input string that will be treated as a secret
 * @returns The resulting key after XORing the two input strings that can be used to decrypt data
 *
 * @beta
 */

export const xorStrings = (s1: string, s2: string) => {
  let result = "";

  // Determine the maximum length between the two strings
  const maxLength = Math.max(s1.length, s2.length);

  console.log("Max Length: ", maxLength);

  // Pad both strings to be the same length
  let paddedS1 = s1.padEnd(maxLength, s1);
  let paddedS2 = s2.padEnd(maxLength, s2);

  console.log("Padded S1: ", paddedS1);
  console.log("Padded S2: ", paddedS2);

  // XOR each character code of both padded strings
  for (let i = 0; i < maxLength; i++) {
    const charCode1 = paddedS1.charCodeAt(i);
    const charCode2 = paddedS2.charCodeAt(i);

    // XOR the char codes and convert back to character
    result += String.fromCharCode(charCode1 ^ charCode2);
  }

  console.log("Result: ", result);

  return result;
};
