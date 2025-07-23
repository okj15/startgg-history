interface Set {
  id: number;
  displayScore: string;
  fullRoundText?: string;
  winnerId?: number;
  completedAt?: number;
  state?: number;
  event: {
    id: number;
    name: string;
    slug: string;
    tournament: {
      id: number;
      name: string;
      slug: string;
    };
  };
  phaseGroup?: {
    id: number;
    displayIdentifier: string;
    phase: {
      name: string;
    };
  };
  slots?: {
    entrant: {
      id: number;
      name: string;
      participants: {
        id: number;
        gamerTag: string;
        user?: {
          id: number;
          slug: string;
        };
      }[];
    };
    standing?: {
      placement: number;
    };
  }[];
}

interface HeadToHeadSet extends Set {
  player1Info: {
    gamerTag: string;
    isWinner: boolean;
  };
  player2Info: {
    gamerTag: string;
    isWinner: boolean;
  };
}

interface PlayerSetsResponse {
  user: {
    player: {
      sets: {
        nodes: Set[];
      };
    };
  };
}

interface PlayerSearchResult {
  id: number;
  gamerTag: string;
  name?: string;
  slug: string;
  avatarUrl?: string;
  recentTournaments?: {
    name: string;
    slug: string;
    date?: number;
  }[];
}

interface Tournament {
  id: number;
  name: string;
  slug: string;
  startAt?: number;
  endAt?: number;
  timezone?: string;
  venueAddress?: string;
  venueName?: string;
  city?: string;
  countryCode?: string;
  isOnline?: boolean;
  numAttendees?: number;
  registrationClosesAt?: number;
  state?: number; // 1: upcoming, 2: active, 3: completed
  images?: {
    url: string;
    type: string;
  }[];
  events?: TournamentEvent[];
  organizer?: {
    id: number;
    slug: string;
  };
  owner?: {
    id: number;
    slug: string;
  };
}

interface TournamentEvent {
  id: number;
  name: string;
  slug: string;
  videogame?: {
    id: number;
    name: string;
    displayName: string;
  };
  numEntrants?: number;
  state?: number;
  startAt?: number;
}

interface TournamentSearchFilters {
  query?: string;
  videogameId?: number;
  countryCode?: string;
  state?: number; // 1: upcoming, 2: active, 3: completed
  upcoming?: boolean;
  past?: boolean;
  minEntrants?: number;
  perPage?: number;
  page?: number;
}

interface TournamentSearchResponse {
  tournaments: {
    pageInfo: {
      total: number;
      totalPages: number;
    };
    nodes: Tournament[];
  };
}


export type { Set, HeadToHeadSet, PlayerSearchResult, Tournament, TournamentEvent, TournamentSearchFilters };

export class StartGGClient {
  private apiUrl = 'https://api.start.gg/gql/alpha';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async getPlayerSets(playerSlug: string, perPage: number = 10, page: number = 1): Promise<Set[]> {
    const userSlug = playerSlug.startsWith('user/') ? playerSlug : `user/${playerSlug}`;
    
    const query = `
      query GetPlayerSets($userSlug: String!, $perPage: Int, $page: Int) {
        user(slug: $userSlug) {
          player {
            sets(perPage: $perPage, page: $page) {
              nodes {
                id
                displayScore
                fullRoundText
                winnerId
                completedAt
                event {
                  name
                  tournament {
                    name
                  }
                }
                slots {
                  entrant {
                    id
                    name
                    participants {
                      id
                      gamerTag
                      user {
                        id
                        slug
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      userSlug,
      perPage,
      page,
    };

    const result = await this.query<PlayerSetsResponse>(query, variables);
    return result.user?.player?.sets?.nodes || [];
  }

  async getHeadToHeadHistory(player1Slug: string, player2Slug: string, perPage: number = 50): Promise<HeadToHeadSet[]> {
    // Get more comprehensive set data for both players
    const player1Sets = await this.getPlayerSets(player1Slug, perPage);
    const player2Sets = await this.getPlayerSets(player2Slug, perPage);

    console.log(`Found ${player1Sets.length} sets for player1 (${player1Slug})`);
    console.log(`Found ${player2Sets.length} sets for player2 (${player2Slug})`);

    const headToHeadSets: HeadToHeadSet[] = [];
    const processedSetIds = new Set<number>();

    // Clean up player slugs for matching
    const cleanPlayer1Slug = player1Slug.toLowerCase().replace('user/', '');
    const cleanPlayer2Slug = player2Slug.toLowerCase().replace('user/', '');
    
    console.log(`Matching for: ${cleanPlayer1Slug} vs ${cleanPlayer2Slug}`);

    // Process all sets from player1
    for (const set of player1Sets) {
      if (processedSetIds.has(set.id) || !set.slots || set.slots.length < 2) {
        continue;
      }

      // Look for both players in this set
      let player1Slot = null;
      let player2Slot = null;

      for (const slot of set.slots) {
        if (!slot.entrant.participants || slot.entrant.participants.length === 0) {
          continue;
        }

        const gamerTags = slot.entrant.participants.map(p => p.gamerTag.toLowerCase());
        const entrantName = slot.entrant.name.toLowerCase();


        // Enhanced matching logic with multiple strategies
        const isPlayer1 = slot.entrant.participants.some(p => {
          if (p.user?.slug) {
            const userSlug = p.user.slug.toLowerCase();
            return userSlug === cleanPlayer1Slug || userSlug === `user/${cleanPlayer1Slug}` || 
                   userSlug.includes(cleanPlayer1Slug) || cleanPlayer1Slug.includes(userSlug.replace('user/', ''));
          }
          return false;
        }) || gamerTags.some(tag => tag === cleanPlayer1Slug) ||
           entrantName.includes(cleanPlayer1Slug);

        const isPlayer2 = slot.entrant.participants.some(p => {
          if (p.user?.slug) {
            const userSlug = p.user.slug.toLowerCase();
            return userSlug === cleanPlayer2Slug || userSlug === `user/${cleanPlayer2Slug}` || 
                   userSlug.includes(cleanPlayer2Slug) || cleanPlayer2Slug.includes(userSlug.replace('user/', ''));
          }
          return false;
        }) || gamerTags.some(tag => tag === cleanPlayer2Slug) ||
           entrantName.includes(cleanPlayer2Slug);

        if (isPlayer1) {
          player1Slot = slot;
        }
        if (isPlayer2) {
          player2Slot = slot;
        }
      }

      // If both players are found in this set, it's a head-to-head match
      if (player1Slot && player2Slot && player1Slot.entrant.id !== player2Slot.entrant.id) {
        const headToHeadSet: HeadToHeadSet = {
          ...set,
          player1Info: {
            gamerTag: player1Slot.entrant.participants[0]?.gamerTag || player1Slot.entrant.name,
            isWinner: set.winnerId === player1Slot.entrant.id
          },
          player2Info: {
            gamerTag: player2Slot.entrant.participants[0]?.gamerTag || player2Slot.entrant.name,
            isWinner: set.winnerId === player2Slot.entrant.id
          }
        };
        headToHeadSets.push(headToHeadSet);
        processedSetIds.add(set.id);
      }
    }

    // Also check player2's sets for any missed matches
    for (const set of player2Sets) {
      if (processedSetIds.has(set.id) || !set.slots || set.slots.length < 2) {
        continue;
      }

      let player1Slot = null;
      let player2Slot = null;

      for (const slot of set.slots) {
        if (!slot.entrant.participants || slot.entrant.participants.length === 0) {
          continue;
        }

        const gamerTags = slot.entrant.participants.map(p => p.gamerTag.toLowerCase());
        const entrantName = slot.entrant.name.toLowerCase();


        const isPlayer1 = slot.entrant.participants.some(p => {
          if (p.user?.slug) {
            const userSlug = p.user.slug.toLowerCase();
            return userSlug === cleanPlayer1Slug || userSlug === `user/${cleanPlayer1Slug}` || 
                   userSlug.includes(cleanPlayer1Slug) || cleanPlayer1Slug.includes(userSlug.replace('user/', ''));
          }
          return false;
        }) || gamerTags.some(tag => tag === cleanPlayer1Slug) ||
           entrantName.includes(cleanPlayer1Slug);

        const isPlayer2 = slot.entrant.participants.some(p => {
          if (p.user?.slug) {
            const userSlug = p.user.slug.toLowerCase();
            return userSlug === cleanPlayer2Slug || userSlug === `user/${cleanPlayer2Slug}` || 
                   userSlug.includes(cleanPlayer2Slug) || cleanPlayer2Slug.includes(userSlug.replace('user/', ''));
          }
          return false;
        }) || gamerTags.some(tag => tag === cleanPlayer2Slug) ||
           entrantName.includes(cleanPlayer2Slug);

        if (isPlayer1) {
          player1Slot = slot;
        }
        if (isPlayer2) {
          player2Slot = slot;
        }
      }

      if (player1Slot && player2Slot && player1Slot.entrant.id !== player2Slot.entrant.id) {
        const headToHeadSet: HeadToHeadSet = {
          ...set,
          player1Info: {
            gamerTag: player1Slot.entrant.participants[0]?.gamerTag || player1Slot.entrant.name,
            isWinner: set.winnerId === player1Slot.entrant.id
          },
          player2Info: {
            gamerTag: player2Slot.entrant.participants[0]?.gamerTag || player2Slot.entrant.name,
            isWinner: set.winnerId === player2Slot.entrant.id
          }
        };
        headToHeadSets.push(headToHeadSet);
        processedSetIds.add(set.id);
      }
    }

    console.log(`Found ${headToHeadSets.length} head-to-head matches`);
    return headToHeadSets.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }

  async searchPlayers(query: string): Promise<PlayerSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();
    const results: PlayerSearchResult[] = [];
    
    // Method 1: Direct slug/ID lookup (like 946a3003)
    if (/^[a-f0-9]{6,}$/i.test(searchTerm) || searchTerm.startsWith('user/')) {
      try {
        const userQuery = `
          query GetUser($slug: String!) {
            user(slug: $slug) {
              id
              slug
              name
              player {
                id
                gamerTag
              }
              images {
                url
                type
              }
            }
          }
        `;

        const result = await this.query<{
          user: {
            id: number;
            slug: string;
            name?: string;
            player?: { id: number; gamerTag: string };
            images?: { url: string; type: string }[];
          } | null;
        }>(userQuery, { slug: searchTerm.startsWith('user/') ? searchTerm : `user/${searchTerm}` });

        if (result.user?.player) {
          results.push({
            id: result.user.player.id,
            gamerTag: result.user.player.gamerTag,
            name: result.user.name,
            slug: result.user.slug,
            avatarUrl: result.user.images?.find(img => img.type === 'profile')?.url,
            recentTournaments: []
          });
        }
      } catch (err) {
        console.log('Direct slug search failed for:', searchTerm, err);
      }
    }

    // For non-slug searches, we can't reliably search start.gg's API
    // Return empty results and let the UI handle manual fallback
    console.log(`Search completed. Found ${results.length} results for: ${searchTerm}`);

    return results;
  }

  async searchTournaments(filters: TournamentSearchFilters = {}): Promise<Tournament[]> {
    const {
      query,
      videogameId,
      countryCode,
      state,
      upcoming,
      past,
      minEntrants,
      perPage = 20,
      page = 1
    } = filters;

    const tournamentQuery = `
      query SearchTournaments(
        $perPage: Int
        $page: Int
        $sortBy: String
        $filter: TournamentPageFilter
      ) {
        tournaments(
          query: {
            perPage: $perPage
            page: $page
            sortBy: $sortBy
            filter: $filter
          }
        ) {
          pageInfo {
            total
            totalPages
          }
          nodes {
            id
            name
            slug
            startAt
            endAt
            timezone
            venueAddress
            venueName
            city
            countryCode
            isOnline
            numAttendees
            registrationClosesAt
            state
            images {
              url
              type
            }
            events {
              id
              name
              videogame {
                displayName
              }
              numEntrants
            }
            owner {
              id
              slug
            }
          }
        }
      }
    `;

    try {
      // Build filter object
      const filter: Record<string, unknown> = {};
      
      if (query) filter.name = query;
      if (videogameId) filter.videogameIds = [videogameId];
      if (countryCode) filter.countryCode = countryCode;
      if (state) filter.state = state;
      if (upcoming !== undefined) filter.upcoming = upcoming;
      if (past !== undefined) filter.past = past;
      // Note: minEntrants filtering done client-side as API doesn't support it
      

      const variables = {
        perPage,
        page,
        sortBy: upcoming ? "startAt asc" : "startAt desc",
        filter
      };

      const result = await this.query<TournamentSearchResponse>(tournamentQuery, variables);
      
      let tournaments = result.tournaments?.nodes?.map(tournament => ({
        ...tournament,
        organizer: tournament.owner ? {
          id: tournament.owner.id,
          slug: tournament.owner.slug
        } : undefined
      })) || [];
      
      // Client-side filtering by minimum entrants
      if (minEntrants) {
        tournaments = tournaments.filter(tournament => 
          tournament.numAttendees && tournament.numAttendees >= minEntrants
        );
      }

      return tournaments;

    } catch (err) {
      console.error('Tournament search failed:', err);
      throw new Error(`Failed to search tournaments: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async getTournament(slug: string): Promise<Tournament | null> {
    const tournamentQuery = `
      query GetTournament($slug: String!) {
        tournament(slug: $slug) {
          id
          name
          slug
          startAt
          endAt
          timezone
          venueAddress
          venueName
          city
          countryCode
          isOnline
          numAttendees
          registrationClosesAt
          state
          images {
            url
            type
          }
          events {
            id
            name
            slug
            numEntrants
            state
            startAt
            videogame {
              id
              name
              displayName
            }
          }
          owner {
            id
            slug
          }
        }
      }
    `;

    try {
      const result = await this.query<{ tournament: Tournament | null }>(tournamentQuery, { slug });
      
      if (result.tournament) {
        return {
          ...result.tournament,
          organizer: result.tournament.owner ? {
            id: result.tournament.owner.id,
            slug: result.tournament.owner.slug
          } : undefined
        };
      }
      
      return null;
    } catch (err) {
      console.error('Tournament fetch failed:', err);
      throw new Error(`Failed to fetch tournament: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

}