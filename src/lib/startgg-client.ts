interface Set {
  id: number;
  displayScore: string;
  event: {
    name: string;
    tournament: {
      name: string;
    };
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

export class StartGGClient {
  private apiUrl = 'https://api.start.gg/gql/alpha';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async query<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
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
                event {
                  name
                  tournament {
                    name
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
}