import Plan from '../models/planModel';
import { handleError } from '../scripts/helper';

export const getMembershipPlans = async (req, res) => {
  let plans = [];
  try {
    plans = await Plan.find();
  } catch (err) {
    return handleError(err, res);
  }

  return res.status(200).json({
    status: 200,
    message: `${plans.length} plans returned`,
    data: plans,
  });
};
