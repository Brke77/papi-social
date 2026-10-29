// Content-Length is optional and untrusted; enforce the cap while consuming bytes.
export async function readBoundedBody(
  request: Request,
  limit: number,
): Promise<Uint8Array> {
  if (!request.body) throw new Error("İstek gövdesi eksik.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("İstek çok büyük.");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
