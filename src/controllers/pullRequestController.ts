import { Request, Response, Router } from 'express';
import { GitHubService } from '../services/githubService';
import { ApiError } from '../error/error';
import { HttpStatusCode } from 'axios';

/**
 * Controller responsible for Pull Request operations.
 */
export class PullRequestController {

    private github: GitHubService;

    constructor() {
        this.github = new GitHubService();
    }

    register(router: Router) {
        router.get('/api/v1/repos/:owner/:repo/pulls', this.getOpenPullRequestsDetails);
    }

    /**
     * Retrieves the open pull requests with commit details from Github API, based on provided request owner and repo.
     * Returns an {@link ApiError} in the body in case an error happens in the process.
     * @param req the request
     * @param res the response
     * @returns
     */
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