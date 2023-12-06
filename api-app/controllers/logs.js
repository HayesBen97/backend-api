import UserLogs from '../models/userLogsModel';

import { handleError } from '../scripts/helper';

export const getUserLogs = async (req, res) => {
  const userId = req.user._id;

  let logs;
  try {
    logs = await UserLogs.find({ userId }, { pageName: 1, createdAt: 1 });
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    message: `${logs.length} logs returned`,
    data: logs,
  });
};
