/** সার্চ ইঞ্জিনের জন্য একটি সম্মিলিত Schema markup (@graph) */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
