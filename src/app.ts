import express, { Request, Response } from 'express';
import { GitHubService } from './services/github';

const app = express();
const github = new GitHubService();

app.get('/:owner/:repo/pulls', async (req: Request, res: Response) => {
    const owner = req.params.owner;
    const repo = req.params.repo;

    const data = await github.getPullRequestsDetails(owner, repo);

    res.send(data);
});

app.listen(3000, () => {
    console.log('App is listening on port 3000!');
});