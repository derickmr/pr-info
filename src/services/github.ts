import axios from 'axios';

export class GitHubService {
    private async fetch(url: string) {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error(`Error fetching data from ${url}`, error);
            throw error;
        }
    }

    async getPullRequestsDetails(owner: string, repo: string): Promise<PullInfo[]> {
        const prs = await this.getOpenPullRequests(owner, repo);
    
        return await Promise.all(prs.map(async pr => {
            const commits = await this.getPullRequestCommits(owner, repo, pr.number)
            const commitCount = (commits as any[]).length
    
            return {
                id: pr.id,
                number: pr.number,
                title: pr.title,
                author: pr.user.login,
                commitCount: commitCount
            } as PullInfo
        }))
    }

    async getOpenPullRequests(owner: string, repo: string): Promise<GithubPullRequest[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`;
        const prs = await this.fetch(url);
        return prs as GithubPullRequest[];
    }

    async getPullRequestCommits(owner: string, repo: string, pull_number: number): Promise<any> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/commits`;
        return this.fetch(url);
    }
}

interface GithubUser {
    login: string;
}

interface GithubPullRequest {
    id: number;
    number: number;
    title: string;
    user: GithubUser;
}

interface PullInfo {
    id: number;
    number: number;
    title: string;
    author: string;
    commitCount: number
}