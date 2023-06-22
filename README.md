# Pull Request Info

Pull Request Info is a simple Node.js application that leverages the GitHub API to fetch details about open pull requests for a specific GitHub repository.

## Features

- Get details about open pull requests, including the author, number, title, and commit count.
- Uses ETag and If-None-Match headers for caching to avoid unnecessary GitHub API requests.

## Requirements

To run this project, you'll need the following environment variables:

- `GITHUB_TOKEN`: A personal access token from GitHub. To generate a new token, follow the instructions in the [GitHub documentation](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token).

Note: This application requires the GitHub token to be set as the GITHUB_TOKEN environment variable. If not provided, the application will not run.

## How to Run

### Development

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm run dev
```

### Production

Build the application:

```bash
npm run build
```

Start the application:

```bash
npm start
```

## Running Tests

You can run unit and integration tests with:

```bash
npm test
```

## API Usage

Fetch open pull request details for a specific repo:

```bash
GET /api/v1/repos/:owner/:repo/pulls
```

Example: GET /api/repos/github/github/pulls will get the open pull requests for the 'github' repository under the 'github' user/organization.

Each pull request in the response includes the author, title, number, and commit count.

## Contributing
We welcome contributions! Please create an issue or open a pull request if you would like to help improve this project.