import axios, { HttpStatusCode } from 'axios';
import { ApiError } from '../error/error';


export class GitHubService {

    etags: Map<string, string>;

    constructor() {
        this.etags = new Map()
    }

    private async fetch(url: string) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'If-None-Match': this.etags.get(url),
                }
            });

            const etag = response.headers.etag;
            if (etag) {
                this.etags.set(url, etag);
            }

            return response;
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
        let response;
        
        try {
            response = await this.fetch(url);
        } catch (error) {
            console.error("Unexpected error while retrieving open pull requests");
            throw new ApiError('Internal server error', HttpStatusCode.InternalServerError, (error as Error).message);
        }

        if (response.status != HttpStatusCode.Ok && response.status != HttpStatusCode.NotModified) {
            console.error(`Error while retrieving open pull requests: ${response.status} - ${response.statusText}`)
            throw new ApiError(response.statusText, response.status, "Error while retrieving open pull requests");
        }

        return response.data as GithubPullRequest[];
    }

    async getPullRequestCommits(owner: string, repo: string, pull_number: number): Promise<GithubCommit[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/commits`;
        let response;
        
        try {
            response = await this.fetch(url);
        } catch (error) {
            console.error(`Unexpected error while retrieving commits for ${repo}/${owner} PR #${pull_number}`);
            throw new ApiError('Internal server error', HttpStatusCode.InternalServerError, (error as Error).message);
        }

        if (response.status != 200) {
            console.error(`Error while retrieving commits for ${repo}/${owner} PR #${pull_number}`);
            throw new ApiError(response.statusText, response.status, "Error while retrieving commits");
        }

        return response.data as GithubCommit[]
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

interface GithubCommit {

}

interface PullInfo {
    id: number;
    number: number;
    title: string;
    author: string;
    commitCount: number
}