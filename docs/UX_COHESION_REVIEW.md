# UX Cohesion Review: One Builder Network

**Assumption:** Feed and Spaces are equally important. Goal: make the app feel like one unified network with multiple interaction layers, not separate products.

---

## 1. Where the app feels like separate products

- **Feed vs Community (Spaces):** The first tab is "Home" (brand name "Strivon" in header); the second is "Community" with a grid icon. There is no shared framing—Feed uses "For You" / "Following," Spaces use "Your Spaces" / "Discover Spaces." Users don’t see that both are the same network (people + topics).
- **Thread screen:** Header says only "Thread." There is no indication that this is a *conversation about a feed post* or that the same people exist in Spaces and DMs. It feels like a standalone comment view.
- **Messages (Inbox):** Tab label is "Messages"; empty states and headers don’t tie DMs to the rest of the network (e.g. "Message people from your feed or spaces").
- **Create flow:** "Share to Spaces" in `SpaceSelector` frames spaces as a *destination* for a post, but there’s no parallel line like "This also appears in your feed" or "Part of the network." So Feed and Spaces feel like two different places to publish.
- **News tab:** Sits as a peer to Home and Community with no explanation that it’s "from the network" or "for builders." It reads as a third, separate product (content/curation).
- **Navigation labels:** Mobile: "Home" / "Community" / "News" / "Messages" / "Profile." Web: "Home" / "Spaces" / "News" / "Create" / "Messages" / "Profile." Inconsistent naming (Community vs Spaces) and no shared "network" language.
- **Empty states:** Feed says "Explore Community" and "Find People"; Spaces say "Discover Spaces" and "Find your first space." Neither says "your network" or "the builder network," so the connection between feed and spaces is implied, not stated.
- **Space detail:** When viewing a space’s Feed tab, posts look like the main feed but there’s no line like "From this space" or "See this in main feed." The relationship between space feed and main feed is unclear.

---

## 2. Connecting Feed, Spaces, Threads, and DMs as layers of one ecosystem

### Conceptual model

- **Layer 1 – Feed:** The network’s surface: posts from people you follow and from spaces you’re in. "What’s happening in your network."
- **Layer 2 – Spaces:** The same network, grouped by topic. Same people, same posts, different view (by community).
- **Layer 3 – Threads:** A post’s conversation. Same identity as in feed/space; the thread is "this post in the network."
- **Layer 4 – DMs:** Direct line to people in your network (from feed, spaces, or threads).

Use one short phrase everywhere: e.g. **"Your network"** or **"The builder network"** so Feed, Spaces, Threads, and DMs all feel like layers of it.

### Visual and structural connections

- **Unified "network" header or subtitle (optional):** On Feed and on Spaces (Community), add a small, consistent line under the main title, e.g. "Your network" or "Builder network." Same treatment on web if you have a top-level title.
- **Threads:** In the thread header, add context: e.g. "Conversation" or "Thread" plus a subtitle like "From your feed" or "From [Space name]" when the post is from a space. So the thread is explicitly tied to feed or space.
- **DMs:** In inbox header or empty state, use copy that ties messages to the rest of the app: e.g. "Message people from your feed and spaces" or "Your network, in private."
- **Post attribution in space:** When a post is shown inside a space, add a small chip or line: "From [Space name]" or "In this space." When the same post is in the main feed, optionally show "Also in [Space name]" so the two layers feel connected.
- **Create flow:** After "Share to Spaces," add one line: e.g. "This will appear in your feed and in the spaces you select." So one post is clearly one action across layers.
- **Back navigation / breadcrumbs:** From thread → back to feed or space; from chat → back to inbox. Where the stack allows, use a back label that reflects the layer: e.g. "Back to feed" or "Back to [Space name]" instead of a generic "Back."

---

## 3. Copy and structural tweaks to reinforce "one builder network, multiple layers"

- **Feed (Home):**
  - Consider a short subtitle under "Strivon" or next to "For You": e.g. "Your network" or "What’s happening in your network."
  - Empty state: Keep "Explore Community" but add: "Your feed and your spaces are the same network—join spaces to see more here."

- **Spaces (Community):**
  - Align naming: use "Spaces" in the nav (like web) so the tab and the concept match; keep "Community" as the screen title if you prefer, but add a subtitle: "Topics in your network" or "Your network by topic."
  - Get-started card: Change "Find your first space" to something like "Find your first space in the network" or "Spaces are where your network groups by topic."
  - Empty state: Add: "Spaces are part of the same network as your feed—same people, grouped by topic."

- **Thread:**
  - Header: "Thread" is fine; add a subtitle when possible: "From your feed" or "From [Space name]."
  - Empty comments: "Start the conversation" or "Be the first to reply in the network."

- **Inbox (Messages):**
  - Empty state: "Message people you follow or meet in spaces" or "Your network, in private."
  - Header: Optional subtitle "Direct messages from your network."

- **Create:**
  - Under "Share to Spaces": "Your post will appear in your feed and in the spaces you choose."
  - If there’s a preview or success message: "Posted to your network" (and list feed + spaces if needed).

- **Search:**
  - Section headers "Users" / "Posts" / "Spaces" can stay; consider a hint: "Search your network" so all results feel like one graph.

- **News:**
  - To reduce feeling like a separate product, add a short line: "From the network" or "Curated for builders in your network" so it’s clearly part of the same ecosystem.

---

## 4. Tab and navigation structure that contribute to fragmentation

- **"Home" vs "Community":** "Home" suggests one place; "Community" suggests another. Option A: Rename to "Feed" and "Spaces" (match web) so both are clearly *views* (feed view vs spaces view). Option B: Keep "Home" but add a shared parent concept in UI or copy (e.g. "Feed · Your network" and "Spaces · Your network").
- **"Community" on mobile vs "Spaces" on web:** Use the same term in both (recommended: "Spaces") so the same concept doesn’t have two names.
- **News as a top-level tab:** It competes with Feed and Spaces. Without removing it: (1) add the "From the network" framing above, and (2) consider a softer placement (e.g. section inside Feed or under a "Discover" or "More" area) later if you want to emphasize Feed + Spaces as the two main layers.
- **Create in the middle:** Create is shared across the network (feed + spaces). A small "Share to your network" or "Post to feed & spaces" near the FAB or create CTA reinforces that one action serves all layers.
- **No shared "You are here" context:** When deep in a space or a thread, the only context is the current screen title. Optional: a thin breadcrumb or one-line context (e.g. "Feed → Thread" or "Spaces → [Space name] → Thread") so users always know which layer they’re in.

---

## Summary

- **Fragmentation:** Feed, Spaces, Threads, and Messages use different language and no shared "network" idea; Create and News don’t explicitly tie to that idea.
- **Cohesion:** Introduce a single phrase ("Your network" / "Builder network") and use it in headers, empty states, and the create flow. Tie Threads to "feed" or "space"; tie DMs to "people in your network." Unify naming (e.g. "Spaces" everywhere) and add light context (subtitles, one-line hints) so Feed and Spaces feel like two views of the same network, and Threads and DMs feel like layers of the same ecosystem.

All suggestions keep existing features; they only add or adjust copy and lightweight structure to improve cohesion and clarity.
