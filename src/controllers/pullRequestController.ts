import { Request, Response } from 'express';
import { GitHubService } from '../services/githubService';
import { ApiError } from '../error/error';
import { HttpStatusCode } from 'axios';

const github = new GitHubService();

export const getOpenPullRequestsDetails = async (req: Request, res: Response) => {
    const owner = req.params.owner;
    const repo = req.params.repo;

    try {
        const data = await github.getOpenPullRequestsDetails(owner, repo);
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