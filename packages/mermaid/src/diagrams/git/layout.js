import { getConfig } from '../../config';

export default (dir, _branches, _commits) => {
  const config = getConfig().gitGraph;
  const branches = [];
  const commits = [];

  for (let i = 0; i < _branches.length; i++) {
    const branch = Object.assign({}, _branches[i]);
    if (dir === 'TB' || dir === 'BT') {
      branch.x = config.branchOffset * i;
      branch.y = -1;
    } else {
      branch.y = config.branchOffset * i;
      branch.x = -1;
    }
    branches.push(branch);
  }

  return { branches, commits };
};
