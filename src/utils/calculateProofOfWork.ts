export async function calculateProofOfWork(challengeId: string, difficulty: number = 4): Promise<string> {
  const prefix = '0'.repeat(difficulty);
  const encoder = new TextEncoder();

  for (let nonce = 0; nonce < Number.MAX_SAFE_INTEGER; nonce++) {
    const data = encoder.encode(`${challengeId}:${nonce}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex.startsWith(prefix)) {
      return nonce.toString();
    }
  }

  throw new Error("Proof of Work not found.");
}
