import { Request, Response, Router } from 'express';
import { GitHubService } from '../services/githubService';
import { ApiError } from '../error/error';
import { HttpStatusCode } from 'axios';

export class PullRequestController {

    private github: GitHubService;

    constructor() {
        this.github = new GitHubService();
    }

    register(router: Router) {
        router.get('/api/v1/repos/:owner/:repo/pulls', this.getOpenPullRequestsDetails);
    }

    private getOpenPullRequestsDetails = async (req: Request, res: Response) => {
        const owner = req.params.owner;
        const repo = req.params.repo;

        try {
            const data = await this.github.getOpenPullRequestsDetails(owner, repo);
            res.send(data);
        } catch (error) {
            if (error instanceof ApiError) {
                const apiError = error as ApiError;
                res.status(apiError.httpCode).send(apiError)
                return;
            }
            res.status(HttpStatusCode.InternalServerError).send(error)
        }
    };
}