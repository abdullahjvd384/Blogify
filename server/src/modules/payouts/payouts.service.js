import mongoose from 'mongoose';
import { PayoutPeriod } from '../../models/PayoutPeriod.js';
import { WriterEarning } from '../../models/WriterEarning.js';
import { WriterWallet } from '../../models/WriterWallet.js';
import { Withdrawal } from '../../models/Withdrawal.js';
import { Payment } from '../../models/Payment.js';
import { Read } from '../../models/Read.js';
import { User } from '../../models/User.js';
import { MEMBERSHIP } from '@blogplatform/shared';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors.js';

const TZ = MEMBERSHIP.PLATFORM_TZ;
const MIN_READ_SECONDS = 10; // ignore bounce reads in payout math

function toObjId(id) {
  return new mongoose.Types.ObjectId(id);
}

/** Offset (minutes) of `tz` at a given instant. */
function tzOffsetMinutes(tz, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(date)
    .reduce((a, p) => ((a[p.type] = p.value), a), {});
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUTC - date.getTime()) / 60000;
}

/** UTC instant for `YYYY-MM-01 00:00` local-to-tz. */
function monthStartUtc(year, month1to12) {
  const guess = new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0));
  const offset = tzOffsetMinutes(TZ, guess);
  return new Date(guess.getTime() - offset * 60000);
}

/** [start, end) UTC bounds for a YYYY-MM period in the platform timezone. */
function monthBounds(periodKey) {
  const [y, m] = periodKey.split('-').map(Number);
  const start = monthStartUtc(y, m);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const end = monthStartUtc(nextY, nextM);
  return { start, end };
}

/** Current period key (YYYY-MM) in the platform timezone. */
export function currentPeriodKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' })
    .formatToParts(now)
    .reduce((a, p) => ((a[p.type] = p.value), a), {});
  return `${parts.year}-${parts.month}`;
}

/**
 * Pure computation for a period — no writes. Returns membership revenue, the
 * writer pool, total eligible member reading-seconds, and per-writer seconds.
 * Eligible reads: by a member, on a member-only story, not the author's own,
 * clean (fraud_score 0), past the minimum dwell time.
 */
export async function computePeriod(periodKey) {
  const { start, end } = monthBounds(periodKey);

  const [revenueAgg, writerRows] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'success', plan_key: 'member', completed_at: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount_paisa' } } },
    ]),
    Read.aggregate([
      {
        $match: {
          ended_at: { $gte: start, $lt: end },
          reader_was_member: true,
          fraud_score: 0,
          watched_seconds: { $gte: MIN_READ_SECONDS },
        },
      },
      { $lookup: { from: 'articles', localField: 'article_id', foreignField: '_id', as: 'art' } },
      { $unwind: '$art' },
      { $match: { 'art.member_only': true, $expr: { $ne: ['$user_id', '$art.author_id'] } } },
      { $group: { _id: '$art.author_id', seconds: { $sum: '$watched_seconds' } } },
      { $sort: { seconds: -1 } },
    ]),
  ]);

  const memberRevenuePaisa = revenueAgg[0]?.total || 0;
  const poolPaisa = Math.round((memberRevenuePaisa * MEMBERSHIP.PAYOUT_PERCENT) / 100);
  const totalSeconds = writerRows.reduce((s, r) => s + r.seconds, 0);
  const rows = writerRows.map((r) => ({
    writerId: r._id,
    seconds: r.seconds,
    amountPaisa: totalSeconds > 0 ? Math.floor((poolPaisa * r.seconds) / totalSeconds) : 0,
  }));

  return { periodKey, memberRevenuePaisa, poolPaisa, totalSeconds, rows };
}

async function attachWriterNames(rows) {
  const ids = rows.map((r) => r.writerId);
  const users = await User.find({ _id: { $in: ids } }, { name: 1, username: 1 }).lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return rows.map((r) => {
    const u = byId.get(r.writerId.toString());
    return { ...r, writerId: r.writerId.toString(), name: u?.name || 'Unknown', username: u?.username || null };
  });
}

/** Admin: dry-run a period without finalizing. */
export async function previewPeriod(periodKey) {
  const computed = await computePeriod(periodKey);
  const period = await PayoutPeriod.findOne({ period_key: periodKey }).lean();
  return {
    ...computed,
    rows: await attachWriterNames(computed.rows),
    status: period?.status || 'open',
  };
}

/** Admin: list payout periods, newest first. */
export async function listPeriods() {
  return PayoutPeriod.find({}).sort({ period_key: -1 }).limit(36).lean();
}

/**
 * Admin: finalize a period. Idempotent — re-running a finalized period is a
 * no-op. Credits each writer's wallet by their share of the pool.
 */
export async function closePeriod(periodKey, admin) {
  const existing = await PayoutPeriod.findOne({ period_key: periodKey });
  if (existing && existing.status !== 'open') {
    return existing.toObject(); // already finalized/paid
  }

  const { memberRevenuePaisa, poolPaisa, totalSeconds, rows } = await computePeriod(periodKey);

  const period =
    existing ||
    (await PayoutPeriod.create({ period_key: periodKey, status: 'open' }));
  period.member_revenue_paisa = memberRevenuePaisa;
  period.payout_percent = MEMBERSHIP.PAYOUT_PERCENT;
  period.pool_paisa = poolPaisa;
  period.total_seconds = totalSeconds;
  period.writer_count = rows.length;
  period.status = 'finalized';
  period.finalized_at = new Date();
  period.finalized_by = toObjId(admin.id);
  await period.save();

  for (const r of rows) {
    if (r.amountPaisa <= 0) continue;
    await WriterEarning.create({
      period_id: period._id,
      period_key: periodKey,
      writer_id: r.writerId,
      seconds: r.seconds,
      amount_paisa: r.amountPaisa,
    });
    await WriterWallet.updateOne(
      { user_id: r.writerId },
      { $inc: { available_paisa: r.amountPaisa, lifetime_paisa: r.amountPaisa } },
      { upsert: true },
    );
  }

  return period.toObject();
}

/** Writer: wallet + finalized earnings history + a live estimate for the open month. */
export async function getMyEarnings(writerId) {
  const [wallet, earnings, computed] = await Promise.all([
    WriterWallet.findOne({ user_id: writerId }).lean(),
    WriterEarning.find({ writer_id: writerId }).sort({ _id: -1 }).limit(24).lean(),
    computePeriod(currentPeriodKey()),
  ]);
  const mine = computed.rows.find((r) => r.writerId.toString() === writerId.toString());
  return {
    wallet: {
      availablePaisa: wallet?.available_paisa || 0,
      pendingPaisa: wallet?.pending_paisa || 0,
      lifetimePaisa: wallet?.lifetime_paisa || 0,
    },
    currentPeriod: {
      periodKey: computed.periodKey,
      seconds: mine?.seconds || 0,
      estimatedPaisa: mine?.amountPaisa || 0,
    },
    earnings: earnings.map((e) => ({
      id: e._id.toString(),
      periodKey: e.period_key,
      seconds: e.seconds,
      amountPaisa: e.amount_paisa,
      createdAt: e.created_at,
    })),
  };
}

/** Writer: request a cash-out. Reserves the amount (available → pending) atomically. */
export async function requestWithdrawal(writerId, { amountPaisa, accountNumber }) {
  if (!Number.isInteger(amountPaisa) || amountPaisa < MEMBERSHIP.MIN_WITHDRAWAL_PAISA) {
    throw new ValidationError(
      `Minimum withdrawal is ${MEMBERSHIP.MIN_WITHDRAWAL_PAISA / 100} PKR`,
    );
  }
  // Atomic reserve: only succeeds if available covers the amount.
  const updated = await WriterWallet.findOneAndUpdate(
    { user_id: toObjId(writerId), available_paisa: { $gte: amountPaisa } },
    { $inc: { available_paisa: -amountPaisa, pending_paisa: amountPaisa } },
    { new: true },
  );
  if (!updated) throw new ConflictError('Insufficient available balance');

  const withdrawal = await Withdrawal.create({
    writer_id: toObjId(writerId),
    amount_paisa: amountPaisa,
    account_number: accountNumber,
    status: 'requested',
  });
  return withdrawal.toObject();
}

export async function listMyWithdrawals(writerId) {
  return Withdrawal.find({ writer_id: toObjId(writerId) }).sort({ _id: -1 }).limit(50).lean();
}

/** Admin: list withdrawal requests, optionally by status, enriched with writer. */
export async function adminListWithdrawals({ status, limit }) {
  const filter = {};
  if (status) filter.status = status;
  const items = await Withdrawal.find(filter).sort({ _id: -1 }).limit(limit).lean();
  if (!items.length) return items;
  const ids = [...new Set(items.map((w) => w.writer_id.toString()))];
  const users = await User.find({ _id: { $in: ids } }, { name: 1, username: 1, email: 1 }).lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return items.map((w) => ({ ...w, writer: byId.get(w.writer_id.toString()) || null }));
}

/** Admin: confirm a withdrawal was paid out-of-band — clears the reserved amount. */
export async function adminMarkPaid(withdrawalId, admin) {
  const w = await Withdrawal.findById(withdrawalId);
  if (!w) throw new NotFoundError('Withdrawal not found');
  if (w.status === 'paid') return w.toObject(); // idempotent
  if (w.status === 'rejected') throw new ConflictError('Withdrawal was rejected');

  await WriterWallet.updateOne({ user_id: w.writer_id }, { $inc: { pending_paisa: -w.amount_paisa } });
  w.status = 'paid';
  w.processed_by = toObjId(admin.id);
  w.processed_at = new Date();
  await w.save();
  return w.toObject();
}

/** Admin: reject a withdrawal — refunds the reserved amount to available. */
export async function adminRejectWithdrawal(withdrawalId, admin, { note }) {
  const w = await Withdrawal.findById(withdrawalId);
  if (!w) throw new NotFoundError('Withdrawal not found');
  if (w.status === 'rejected') return w.toObject(); // idempotent
  if (w.status === 'paid') throw new ConflictError('Withdrawal was already paid');

  await WriterWallet.updateOne(
    { user_id: w.writer_id },
    { $inc: { pending_paisa: -w.amount_paisa, available_paisa: w.amount_paisa } },
  );
  w.status = 'rejected';
  w.note = note || null;
  w.processed_by = toObjId(admin.id);
  w.processed_at = new Date();
  await w.save();
  return w.toObject();
}
