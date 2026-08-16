import { SportsTicket } from '../models/SportsTicket';

export const getSportsLiability = async () => SportsTicket.aggregate([
  { $match: { status: { $in: ['FUNDS_RESERVED', 'ACCEPTED', 'SETTLEMENT_PENDING'] } } },
  { $group: { _id: '$provider', ticketCount: { $sum: 1 }, maxPayoutMinor: { $sum: '$maxPayoutMinor' }, stakeMinor: { $sum: '$stakeMinor' } } },
  { $project: { provider: '$_id', ticketCount: 1, maxPayoutMinor: { $toString: '$maxPayoutMinor' }, stakeMinor: { $toString: '$stakeMinor' }, _id: 0 } }
]);
