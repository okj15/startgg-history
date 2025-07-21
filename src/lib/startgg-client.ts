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

export type { Set, HeadToHeadSet };

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

        const userSlugs = slot.entrant.participants.map(p => p.user?.slug?.toLowerCase() || '').filter(Boolean);

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

        const userSlugs = slot.entrant.participants.map(p => p.user?.slug?.toLowerCase() || '').filter(Boolean);

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
}