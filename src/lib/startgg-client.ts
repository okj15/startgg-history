interface Set {
  id: number;
  displayScore: string;
  winnerId?: number;
  completedAt?: number;
  event: {
    name: string;
    tournament: {
      name: string;
    };
  };
  slots?: {
    entrant: {
      id: number;
      name: string;
      participants: {
        gamerTag: string;
      }[];
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
                      gamerTag
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
    const player1Sets = await this.getPlayerSets(player1Slug, perPage);
    const player2Sets = await this.getPlayerSets(player2Slug, perPage);

    const headToHeadSets: HeadToHeadSet[] = [];

    for (const set1 of player1Sets) {
      const matchingSet = player2Sets.find(set2 => set1.id === set2.id);
      if (matchingSet && set1.slots && set1.slots.length >= 2) {
        const player1Slot = set1.slots.find(slot => 
          slot.entrant.participants.some(p => p.gamerTag.toLowerCase().includes(player1Slug.toLowerCase().replace('user/', '')))
        );
        const player2Slot = set1.slots.find(slot => 
          slot.entrant.participants.some(p => p.gamerTag.toLowerCase().includes(player2Slug.toLowerCase().replace('user/', '')))
        );

        if (player1Slot && player2Slot) {
          const headToHeadSet: HeadToHeadSet = {
            ...set1,
            player1Info: {
              gamerTag: player1Slot.entrant.participants[0]?.gamerTag || player1Slot.entrant.name,
              isWinner: set1.winnerId === player1Slot.entrant.id
            },
            player2Info: {
              gamerTag: player2Slot.entrant.participants[0]?.gamerTag || player2Slot.entrant.name,
              isWinner: set1.winnerId === player2Slot.entrant.id
            }
          };
          headToHeadSets.push(headToHeadSet);
        }
      }
    }

    return headToHeadSets.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }
}