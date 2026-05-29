import * as service from './payouts.service.js';
import { present, presentMany } from '../../utils/presenter.js';
import { ok, created } from '../../utils/response.js';

// ---- Writer ----

export async function myEarnings(req, res) {
  return ok(res, { earnings: await service.getMyEarnings(req.user.id) });
}

export async function requestWithdrawal(req, res) {
  const withdrawal = await service.requestWithdrawal(req.user.id, req.valid.body);
  return created(res, { withdrawal: present(withdrawal) });
}

export async function myWithdrawals(req, res) {
  const items = await service.listMyWithdrawals(req.user.id);
  return ok(res, { withdrawals: presentMany(items) });
}

// ---- Admin: payouts ----

export async function listPeriods(req, res) {
  const items = await service.listPeriods();
  return ok(res, { periods: presentMany(items) });
}

export async function preview(req, res) {
  const result = await service.previewPeriod(req.valid.query.periodKey);
  return ok(res, { preview: result });
}

export async function closePeriod(req, res) {
  const period = await service.closePeriod(req.valid.body.periodKey, req.user);
  return ok(res, { period: present(period) });
}

// ---- Admin: withdrawals ----

export async function adminListWithdrawals(req, res) {
  const items = await service.adminListWithdrawals(req.valid.query);
  return ok(res, { withdrawals: presentMany(items) });
}

export async function adminMarkPaid(req, res) {
  const w = await service.adminMarkPaid(req.valid.params.id, req.user);
  return ok(res, { withdrawal: present(w) });
}

export async function adminReject(req, res) {
  const w = await service.adminRejectWithdrawal(req.valid.params.id, req.user, req.valid.body);
  return ok(res, { withdrawal: present(w) });
}
