/**
 * Shared API request/response types. Use these when calling the API client
 * or when replacing mocks with real endpoints.
 */

export interface ApiUser {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  label?: string;
  bio?: string;
  banner?: string | null;
  occupation?: string;
  country?: string;
  state?: string;
  city?: string;
  openToLocalMeetups?: boolean;
  joinDate?: string;
}

export interface ApiUserProfileUpdate {
  name?: string;
  handle?: string;
  bio?: string;
  avatar?: string | null;
  banner?: string | null;
  occupation?: string;
  country?: string;
  state?: string;
  city?: string;
  openToLocalMeetups?: boolean;
}
