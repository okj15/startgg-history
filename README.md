# start.gg Match History Viewer

A Next.js web application to view tournament match history from start.gg using their GraphQL API.

## Features

- Search for players by ID
- View match history with tournament and event details
- Responsive design with Tailwind CSS
- Error handling and loading states

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get your start.gg API token:
   - Go to https://start.gg/admin/profile
   - Navigate to "Developer Settings"
   - Click "Create new token"
   - Copy the token

3. Configure environment variables:
   Edit `.env.local` and add your API token:
   ```
   NEXT_PUBLIC_STARTGG_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter a player ID in the search field
2. Click "Search" to fetch their match history
3. View the tournament matches with scores and event details

## API Reference

This app uses the start.gg GraphQL API to fetch player match data. The main query used:

```graphql
query GetPlayerSets($playerId: ID!, $perPage: Int, $page: Int) {
  player(id: $playerId) {
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
```

## Technologies Used

- Next.js 15
- TypeScript
- Tailwind CSS
- start.gg GraphQL API
