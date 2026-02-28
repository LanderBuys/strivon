"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getFeedPosts, likePost, savePost } from "@/lib/api/posts";
import type { Post } from "@/types/post";
import { FeedScreenHeader } from "@/components/feed/FeedScreenHeader";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { SortMenu, type SortOption, type ContentFilterType, type LocationScope } from "@/components/feed/SortMenu";
import { EmptyState } from "@/components/feed/EmptyState";
import { SearchOverlay } from "@/components/feed/SearchOverlay";
import { ScrollToTopButton } from "@/components/feed/ScrollToTopButton";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { PostCard } from "@/components/feed/PostCard";
import { PostSkeleton } from "@/components/feed/PostSkeleton";

const PAGE_SIZE = 10;
const FEED_SORT_KEY = "strivon_feed_sort";
const FEED_FILTER_KEY = "strivon_feed_filter";
const FEED_LOCATION_KEY = "strivon_feed_location";
const SCROLL_THRESHOLD = 400;

export default function FeedPage() {
  const [tab, setTab] = useState<"for-you" | "following">("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [contentFilter, setContentFilter] = useState<ContentFilterType>("all");
  const [locationScope, setLocationScope] = useState<LocationScope>("global");
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const s = localStorage.getItem(FEED_SORT_KEY) as SortOption | null;
      const f = localStorage.getItem(FEED_FILTER_KEY) as ContentFilterType | null;
      const l = localStorage.getItem(FEED_LOCATION_KEY) as LocationScope | null;
      if (s && ["newest", "popular", "trending"].includes(s)) setSortOption(s);
      if (f && ["all", "media", "text", "links"].includes(f)) setContentFilter(f);
      if (l && ["local", "my_country", "global"].includes(l)) setLocationScope(l);
    } finally {
      setPrefsLoaded(true);
    }
  }, []);

  const persistSort = useCallback((s: SortOption) => {
    setSortOption(s);
    try {
      localStorage.setItem(FEED_SORT_KEY, s);
    } catch {}
  }, []);
  const persistFilter = useCallback((f: ContentFilterType) => {
    setContentFilter(f);
    try {
      localStorage.setItem(FEED_FILTER_KEY, f);
    } catch {}
  }, []);
  const persistLocation = useCallback((l: LocationScope) => {
    setLocationScope(l);
    try {
      localStorage.setItem(FEED_LOCATION_KEY, l);
    } catch {}
  }, []);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await getFeedPosts(tab, pageNum, PAGE_SIZE);
        if (append) setPosts((prev) => [...prev, ...result.data]);
        else setPosts(result.data);
        setHasMore(result.hasMore);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load feed";
        setError(
          msg.includes("network") || msg.includes("Network")
            ? "Network error. Please check your connection."
            : "Failed to load posts. Please try again."
        );
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    if (!prefsLoaded) return;
    setPage(1);
    loadPage(1, false);
  }, [tab, sortOption, contentFilter, locationScope, prefsLoaded, loadPage]);

  // Scroll position for scroll-to-top FAB
  useEffect(() => {
    const el = scrollContainerRef.current ?? document.documentElement;
    const onScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      setShowScrollToTop(scrollTop > SCROLL_THRESHOLD);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    loadPage(next, true);
  };

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleTabChange = useCallback((newTab: "for-you" | "following") => {
    if (newTab === tab) return;
    setTab(newTab);
    setPage(1);
    setError(null);
  }, [tab]);

  const handleRetry = useCallback(() => {
    setError(null);
    loadPage(1, false);
  }, [loadPage]);

  const handleLike = useCallback(async (postId: string) => {
    await likePost(postId);
  }, []);

  const handleSave = useCallback(async (postId: string) => {
    await savePost(postId);
  }, []);

  const unreadNotifications = 0;

  return (
    <div ref={scrollContainerRef} className="mx-auto w-full max-w-2xl bg-[var(--background)]">
      <div>
        <FeedScreenHeader
          unreadNotifications={unreadNotifications}
          onSearchPress={() => setShowSearch(true)}
          onRefreshPress={() => loadPage(1, false)}
        />
      </div>

      <div>
        <StoriesBar />
      </div>

      <div className="mt-0">
        <FeedTabs
          activeTab={tab}
          onTabChange={handleTabChange}
          filterButton={
            <button
              type="button"
              onClick={() => setShowSortMenu(true)}
              className="smooth-btn flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
              aria-label="Sort and filter"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 1-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 1-3 0m-3.75 0H7.5m9-6h9.75M7.5 3h-9.75A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h9.75a2.25 2.25 0 0 0 2.25-2.25V5.25A2.25 2.25 0 0 0 17.25 3h-9.75Z" />
              </svg>
            </button>
          }
        />
      </div>

      <SortMenu
        activeSort={sortOption}
        onSortChange={persistSort}
        activeFilter={contentFilter}
        onFilterChange={persistFilter}
        locationScope={locationScope}
        onLocationScopeChange={persistLocation}
        visible={showSortMenu}
        onClose={() => setShowSortMenu(false)}
      />

      <SearchOverlay
        visible={showSearch}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={() => { setShowSearch(false); setSearchQuery(""); }}
        allPosts={posts}
      />

      {(loading && posts.length === 0) ? (
        <div className="mt-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16">
          <div className="flex max-w-[300px] flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</h2>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{error}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="smooth-btn inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Try again
              </button>
              <Link
                href="/app/spaces"
                className="smooth-btn inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
              >
                Explore Community
              </Link>
            </div>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="mail"
          title="No posts yet"
          message={
            tab === "for-you"
              ? "Your feed is empty. Start following people or join spaces to see posts here!"
              : "You're not following anyone yet. Discover and follow people to see their posts here!"
          }
          primaryAction={{ label: "Explore Community", href: "/app/spaces" }}
          secondaryAction={{ label: "Find People", href: "/app/spaces" }}
        />
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onSave={handleSave}
                index={index}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="smooth-btn rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent)]/30 disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      <ScrollToTopButton visible={showScrollToTop} onClick={handleScrollToTop} />
    </div>
  );
}
