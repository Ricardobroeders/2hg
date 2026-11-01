import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Every heading becomes an <h3>: notes sit under the deck's own <h2>, and a
 * pasted "# Title" must not compete with the page's <h1>.
 */
const heading: Components["h1"] = ({ children }) => <h3>{children}</h3>;

const components: Components = {
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  h5: heading,
  h6: heading,
  // Anyone can write these notes, signed in or not. `ugc nofollow` tells
  // search engines we don't vouch for the link, which is also what stops a
  // public, indexable page being worth spamming.
  a: ({ href, children }) => (
    <a href={href} rel="ugc nofollow noopener noreferrer" target="_blank">
      {children}
    </a>
  ),
};

/**
 * A deck's notes on its share page, rendered from markdown on the server so
 * the primer is in the HTML a crawler reads.
 *
 * Safe by construction rather than by sanitising: react-markdown never renders
 * raw HTML (there's no rehype-raw here) and strips `javascript:` URLs. Images
 * are dropped too — an `![](…)` would let anyone embed a tracking pixel on a
 * page served from our domain.
 */
export function DeckNotesView({ markdown }: { markdown: string }) {
  if (!markdown.trim()) return null;
  return (
    <div className="notes-prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={components}
        disallowedElements={["img"]}
        unwrapDisallowed
      >
        {markdown}
      </Markdown>
    </div>
  );
}
