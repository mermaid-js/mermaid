import { getConfig } from '../../config';

export default (dir, _branches) => {
  const config = getConfig().gitGraph;
  const branches = [];
  const commits = [];

  for (const [i, _branch] of _branches.entries()) {
    const branch = Object.assign({}, _branch);
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
