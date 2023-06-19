import axios, { HttpStatusCode } from 'axios';
import { ApiError } from '../error/error';
import { GithubPullRequest, GithubCommit, PullDetails } from '../types/github';

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

            if (!response.data) {
                console.error(`${url} returned no data when it should.`)
                throw new ApiError("No Content", HttpStatusCode.NoContent, `Received no data from ${url}`);
            }

            if (response.status != HttpStatusCode.Ok && response.status != HttpStatusCode.NotModified) {
                console.error(`Received ${response.status}: ${response.statusText} response from GET ${url}`);
                throw new ApiError(response.statusText, response.status, `Error received from Github API when calling ${url}`);
            }

            const etag = response.headers.etag;
            if (etag) {
                this.etags.set(url, etag);
            }

            return response;
        } catch (error) {
            console.error(`Error fetching data from ${url}. Error: ${(error as Error).message}`);
            throw new ApiError('Internal server error', HttpStatusCode.InternalServerError, (error as Error).message);
        }
    }

    async getOpenPullRequestsDetails(owner: string, repo: string): Promise<PullDetails[]> {
        const prs = await this.getOpenPullRequests(owner, repo);
    
        return await Promise.all(prs.map(async pr => {
            const commits = await this.getPullRequestCommits(owner, repo, pr.number)
            const commitCount = commits.length
    
            return {
                id: pr.id,
                number: pr.number,
                title: pr.title,
                author: pr.user.login,
                commitCount: commitCount
            } as PullDetails
        }))
    }

    async getOpenPullRequests(owner: string, repo: string): Promise<GithubPullRequest[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`;
        const response =  await this.fetch(url);
        return response.data as GithubPullRequest[];
    }

    async getPullRequestCommits(owner: string, repo: string, pull_number: number): Promise<GithubCommit[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/commits`;
        const response = await this.fetch(url);
        return response.data as GithubCommit[]
    }
}